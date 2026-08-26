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
        if (rawSpecies != null && !rawSpecies.isBlank()) {
            String lower = rawSpecies.toLowerCase();
            if (lower.contains("cat") || lower.contains("feline")) return "Cat";
            if (lower.contains("dog") || lower.contains("canine")) return "Dog";
            if (lower.contains("rabbit") || lower.contains("bunny")) return "Rabbit";
            if (lower.contains("bird") || lower.contains("avian")) return "Bird";
            if (lower.contains("horse") || lower.contains("equine")) return "Horse";
            if (lower.contains("small") || lower.contains("furry") || lower.contains("rodent")) return "Small & Furry";
            return capitalize(rawSpecies);
        }

        if (breed != null && !breed.isBlank()) {
            String b = breed.toLowerCase();

            // Cats
            if (b.contains("cat") || b.contains("domestic short") || b.contains("domestic long") ||
                b.contains("domestic medium") || b.contains("siamese") || b.contains("tabby") ||
                b.contains("persian") || b.contains("maine coon") || b.contains("calico") ||
                b.contains("tortoiseshell") || b.contains("shorthair") || b.contains("longhair") ||
                b.contains("ragdoll") || b.contains("bengal") || b.contains("sphynx") ||
                b.contains("abyssinian") || b.contains("burmese") || b.contains("russian blue")) {
                return "Cat";
            }

            // Rabbits
            if (b.contains("rabbit") || b.contains("bunny") || b.contains("new zealand") ||
                b.contains("holland lop") || b.contains("mini lop") || b.contains("lionhead") ||
                b.contains("flemish giant") || b.contains("netherland dwarf") || b.contains("rex") ||
                b.contains("dutch") || b.contains("angora") || b.contains("harlequin") ||
                b.contains("havana") || b.contains("chinchilla rabbit") || b.contains("lop")) {
                return "Rabbit";
            }

            // Birds
            if (b.contains("bird") || b.contains("parrot") || b.contains("cockatiel") ||
                b.contains("parakeet") || b.contains("macaw") || b.contains("conure") ||
                b.contains("cockatoo") || b.contains("finch") || b.contains("canary") ||
                b.contains("lovebird") || b.contains("budgie") || b.contains("african grey")) {
                return "Bird";
            }

            // Small & Furry
            if (b.contains("guinea pig") || b.contains("hamster") || b.contains("ferret") ||
                b.contains("chinchilla") || b.contains("hedgehog") || b.contains("gerbil") ||
                b.contains("mouse") || b.contains("rat") || b.contains("sugar glider")) {
                return "Small & Furry";
            }

            // Horses & Farm
            if (b.contains("horse") || b.contains("pony") || b.contains("thoroughbred") ||
                b.contains("quarter horse") || b.contains("arabian") || b.contains("appaloosa") ||
                b.contains("goat") || b.contains("pig") || b.contains("sheep")) {
                return "Horse";
            }
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