package com.htabler0405.adoptme.services;

import com.htabler0405.adoptme.dto.rescuegroups.RescueGroupsResponseDto;
import com.htabler0405.adoptme.dto.rescuegroups.RescueGroupsResponseDto.RescueGroupsAnimalData;
import com.htabler0405.adoptme.dto.rescuegroups.RescueGroupsResponseDto.RescueGroupsIncludedItem;
import com.htabler0405.adoptme.entities.AnimalProfile;
import com.htabler0405.adoptme.entities.Shelter;
import com.htabler0405.adoptme.repositories.AnimalProfileRepository;
import com.htabler0405.adoptme.repositories.AnimalShelterRepository;
import com.htabler0405.adoptme.sources.SourceType;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
public class RescueGroupsSyncService {

    private final RestClient rescueGroupsRestClient;
    private final AnimalShelterRepository shelterRepository;
    private final AnimalProfileRepository animalRepository;
    private final GeometryFactory geometryFactory;

    public RescueGroupsSyncService(
            RestClient rescueGroupsRestClient,
            AnimalShelterRepository shelterRepository,
            AnimalProfileRepository animalRepository,
            GeometryFactory geometryFactory) {
        this.rescueGroupsRestClient = rescueGroupsRestClient;
        this.shelterRepository = shelterRepository;
        this.animalRepository = animalRepository;
        this.geometryFactory = geometryFactory;
    }

    @Transactional
    public int syncAnimalsNearZip(String postalCode, int distanceMiles) {
        log.info("Starting multi-page RescueGroups sync near {} ({} mi radius)...", postalCode, distanceMiles);

        int totalSaved = 0;
        int maxPages = 10; // Ingest up to 1,000 animals (10 pages * 100)

        for (int page = 1; page <= maxPages; page++) {
            final int currentPage = page;
            log.info("Fetching page {} of {} from RescueGroups...", currentPage, maxPages);

            RescueGroupsResponseDto response;
            try {
                response = rescueGroupsRestClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/public/animals/search/available")
                                .queryParam("include", "orgs,pictures")
                                .queryParam("location", postalCode)
                                .queryParam("distance", distanceMiles)
                                .queryParam("limit", 100)
                                .queryParam("page", currentPage)
                                .build())
                        .retrieve()
                        .body(RescueGroupsResponseDto.class);
            } catch (Exception e) {
                log.error("Failed to query RescueGroups page {}: {}", currentPage, e.getMessage());
                break;
            }

            if (response == null || response.data() == null || response.data().isEmpty()) {
                log.info("No more animals found at page {}. Ending sync.", currentPage);
                break;
            }

            Map<String, RescueGroupsIncludedItem> includedMap = Optional.ofNullable(response.included())
                    .orElse(Collections.emptyList())
                    .stream()
                    .collect(Collectors.toMap(RescueGroupsIncludedItem::id, Function.identity(), (a, b) -> a));

            Map<String, Shelter> shelterCache = new HashMap<>();

            for (RescueGroupsIncludedItem item : includedMap.values()) {
                if ("orgs".equalsIgnoreCase(item.type()) || "organizations".equalsIgnoreCase(item.type())) {
                    try {
                        Long orgId = Long.parseLong(item.id());
                        Shelter shelter = shelterRepository.findByRescuegroupsOrgId(orgId)
                                .orElseGet(() -> {
                                    Shelter s = new Shelter();
                                    s.setRescuegroupsOrgId(orgId);
                                    s.setSourcetype(SourceType.SHELTER);
                                    return s;
                                });

                        var attr = item.attributes();
                        shelter.setName(attr.name() != null ? attr.name() : "Rescue Partner");
                        shelter.setEmail(attr.email());
                        shelter.setPhoneNumber(attr.phone());

                        String street = attr.street() != null ? attr.street().trim() : "";
                        String city = attr.city() != null ? attr.city().trim() : "";
                        String state = attr.state() != null ? attr.state().trim() : "";
                        String zip = attr.postalcode() != null ? attr.postalcode().trim() : postalCode;

                        StringBuilder addressBuilder = new StringBuilder();
                        if (!street.isEmpty()) addressBuilder.append(street).append(", ");
                        if (!city.isEmpty()) addressBuilder.append(city).append(", ");
                        if (!state.isEmpty()) addressBuilder.append(state).append(" ");
                        if (!zip.isEmpty()) addressBuilder.append(zip);

                        String finalAddress = addressBuilder.toString().trim();
                        shelter.setAddress(!finalAddress.isEmpty() ? finalAddress : (city.isEmpty() ? "Regional Foster Network" : city + ", " + state));
                        shelter.setZipCode(zip);
                        shelter.setWebsiteUrl(attr.url());
                        shelter.setAdoptionListingsUrl(attr.url());

                        if (attr.lat() != null && attr.lon() != null) {
                            double lat = attr.lat();
                            double lon = attr.lon();
                            double realLat = (Math.abs(lat) <= 90.0) ? lat : lon;
                            double realLon = (Math.abs(lon) > 90.0 || lon < 0) ? lon : lat;
                            shelter.setLocation(geometryFactory.createPoint(new Coordinate(realLon, realLat)));
                        }

                        shelterCache.put(item.id(), shelterRepository.save(shelter));
                    } catch (Exception e) {
                        log.error("Failed to persist shelter org ID {}: {}", item.id(), e.getMessage());
                    }
                }
            }

            int pageSaved = 0;
            for (RescueGroupsAnimalData animalData : response.data()) {
                try {
                    Long petId = Long.parseLong(animalData.id());
                    var attr = animalData.attributes();

                    AnimalProfile profile = animalRepository.findByRescuegroupsPetId(petId)
                            .orElseGet(() -> {
                                AnimalProfile p = new AnimalProfile();
                                p.setRescuegroupsPetId(petId);
                                p.setSourceUrl("https://rescuegroups.org/pet/" + petId);
                                return p;
                            });

                    Shelter shelter = null;
                    if (animalData.relationships() != null &&
                        animalData.relationships().orgs() != null &&
                        !animalData.relationships().orgs().data().isEmpty()) {
                        String orgId = animalData.relationships().orgs().data().get(0).id();
                        shelter = shelterCache.get(orgId);
                    }

                    if (shelter == null) {
                        continue;
                    }

                    profile.setShelter(shelter);
                    profile.setName(attr.name() != null ? attr.name() : "Adoptable Pet");
                    profile.setBreed(attr.breedString() != null ? attr.breedString() : (attr.breedPrimary() != null ? attr.breedPrimary() : "Mixed Breed"));
                    profile.setSpecies(detectSpecies(attr.species(), profile.getBreed()));
                    profile.setGender(attr.sex() != null ? attr.sex().toUpperCase() : "UNKNOWN");
                    profile.setAge(attr.ageGroup() != null ? attr.ageGroup() : (attr.ageString() != null ? attr.ageString() : "Adult"));
                    profile.setSize(attr.sizeGroup() != null ? attr.sizeGroup() : "Medium");
                    profile.setDescription(attr.descriptionText() != null ? attr.descriptionText() : attr.descriptionHtml());
                    profile.setStatus("AVAILABLE");
                    profile.setHypoallergenic(Boolean.TRUE.equals(attr.hypoallergenic()));
                    profile.setGoodWithKids(attr.goodWithKids());
                    profile.setGoodWithDogs(attr.goodWithDogs());
                    profile.setGoodWithCats(attr.goodWithCats());
                    profile.setLastSeenAt(LocalDateTime.now());

                    if (attr.adoptionFeeString() != null) {
                        try {
                            String cleanPrice = attr.adoptionFeeString().replaceAll("[^0-9.]", "");
                            if (!cleanPrice.isEmpty()) {
                                profile.setAdoptionFee(new BigDecimal(cleanPrice));
                            }
                        } catch (Exception ignored) {}
                    }

                    if (animalData.relationships() != null &&
                        animalData.relationships().pictures() != null &&
                        !animalData.relationships().pictures().data().isEmpty()) {
                        String picId = animalData.relationships().pictures().data().get(0).id();
                        RescueGroupsIncludedItem picItem = includedMap.get(picId);
                        if (picItem != null && picItem.attributes() != null) {
                            String imgUrl = extractPictureUrl(picItem.attributes());
                            if (imgUrl != null) {
                                profile.setImageUrl(imgUrl);
                            }
                        }
                    }

                    animalRepository.save(profile);
                    pageSaved++;
                } catch (Exception e) {
                    log.error("Failed to sync animal ID {}: {}", animalData.id(), e.getMessage());
                }
            }

            totalSaved += pageSaved;

            if (response.data().size() < 100) {
                log.info("Reached end of available records on page {}.", currentPage);
                break;
            }

            try {
                Thread.sleep(200);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
        }

        log.info("Multi-page sync complete: saved/updated a total of {} animals.", totalSaved);
        return totalSaved;
    }

    private String detectSpecies(String rawSpecies, String breed) {
        String s = (rawSpecies != null ? rawSpecies.trim().toLowerCase() : "");
        String b = (breed != null ? breed.trim().toLowerCase() : "");
        String combined = (s + " " + b).trim();

        // 1. Direct explicit API species matching
        if (s.equals("dog") || s.equals("dogs") || s.equals("canine")) return "Dog";
        if (s.equals("cat") || s.equals("cats") || s.equals("feline")) return "Cat";
        if (s.equals("bird") || s.equals("birds") || s.equals("avian")) return "Bird";
        if (s.equals("rabbit") || s.equals("rabbits")) return "Rabbit";
        if (s.equals("horse") || s.equals("horses") || s.equals("equine")) return "Horse";
        if (s.contains("small") || s.contains("furry") || s.equals("rodent")) return "Small & Furry";

        // 2. High-precision Dog Breed Signatures
        if (combined.contains("dog") || combined.contains("canine") || combined.contains("shepherd") ||
            combined.contains("poodle") || combined.contains("terrier") || combined.contains("retriever") ||
            combined.contains("hound") || combined.contains("pyrenees") || combined.contains("husky") ||
            combined.contains("collie") || combined.contains("sheepdog") || combined.contains("mastiff") ||
            combined.contains("chihuahua") || combined.contains("pit bull") || combined.contains("bully") ||
            combined.contains("bulldog") || combined.contains("beagle") || combined.contains("boxer") ||
            combined.contains("rottweiler") || combined.contains("corgi") || combined.contains("dachshund") ||
            combined.contains("pinscher") || combined.contains("schnauzer") || combined.contains("spaniel") ||
            combined.contains("setter") || combined.contains("pointer") || combined.contains("great dane") ||
            combined.contains("malamute") || combined.contains("akita") || combined.contains("cattle dog") ||
            combined.contains("heeler") || combined.contains("kelpie") || combined.contains("whippet") ||
            combined.contains("greyhound") || combined.contains("labrador") || combined.contains("golden") ||
            combined.contains("bernese") || combined.contains("saint bernard") || combined.contains("newfoundland") ||
            combined.contains("pug") || combined.contains("maltese") || combined.contains("shih tzu") ||
            combined.contains("havanese") || combined.contains("bichon") || combined.contains("pomeranian") ||
            combined.contains("australian shepherd") || combined.contains("dutch shepherd")) {
            return "Dog";
        }

        // 3. Cat Breed Signatures
        if (combined.contains("cat") || combined.contains("feline") || combined.contains("kitten") ||
            combined.contains("shorthair") || combined.contains("longhair") || combined.contains("mediumhair") ||
            combined.contains("siamese") || combined.contains("tabby") || combined.contains("persian") ||
            combined.contains("maine coon") || combined.contains("calico") || combined.contains("tortoiseshell") ||
            combined.contains("ragdoll") || combined.contains("bengal") || combined.contains("sphynx") ||
            combined.contains("abyssinian") || combined.contains("burmese") || combined.contains("russian blue") ||
            combined.contains("tuxedo") || combined.contains("domestic")) {
            return "Cat";
        }

        // 4. Bird Signatures (Pigeon, Dove, Parrot, etc.)
        if (combined.contains("bird") || combined.contains("pigeon") || combined.contains("dove") ||
            combined.contains("parrot") || combined.contains("parakeet") || combined.contains("cockatiel") ||
            combined.contains("cockatoo") || combined.contains("macaw") || combined.contains("conure") ||
            combined.contains("finch") || combined.contains("canary") || combined.contains("lovebird") ||
            combined.contains("budgie") || combined.contains("african grey") || combined.contains("chicken") ||
            combined.contains("duck") || combined.contains("goose")) {
            return "Bird";
        }

        // 5. Rabbit Signatures
        if (combined.contains("rabbit") || combined.contains("bunny") || combined.contains("holland lop") ||
            combined.contains("mini lop") || combined.contains("lionhead") || combined.contains("flemish giant") ||
            combined.contains("netherland dwarf") || combined.contains("rex rabbit") || combined.contains("angora rabbit") ||
            combined.contains("harlequin rabbit") || combined.contains("chinchilla rabbit")) {
            return "Rabbit";
        }

        // 6. Small & Furry Signatures
        if (combined.contains("guinea pig") || combined.contains("hamster") || combined.contains("ferret") ||
            combined.contains("chinchilla") || combined.contains("hedgehog") || combined.contains("gerbil") ||
            combined.contains("mouse") || combined.contains("rat") || combined.contains("sugar glider") ||
            combined.contains("rodent")) {
            return "Small & Furry";
        }

        // 7. Horse & Equine Signatures
        if (combined.contains("horse") || combined.contains("equine") || combined.contains("pony") ||
            combined.contains("thoroughbred") || combined.contains("quarter horse") || combined.contains("arabian horse") ||
            combined.contains("appaloosa") || combined.contains("mustang") || combined.contains("clydesdale") ||
            combined.contains("morgan horse") || combined.contains("warmblood") || combined.contains("stallion") ||
            combined.contains("mare") || combined.contains("gelding") || combined.contains("foal")) {
            return "Horse";
        }

        if (rawSpecies != null && !rawSpecies.isBlank()) {
            return capitalize(rawSpecies);
        }

        return "Dog";
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }

    private String extractPictureUrl(RescueGroupsIncludedItem.IncludedAttributes attr) {
        if (attr.large() != null && attr.large().get("url") != null) {
            return attr.large().get("url").toString();
        }
        if (attr.original() != null && attr.original().get("url") != null) {
            return attr.original().get("url").toString();
        }
        return null;
    }
}