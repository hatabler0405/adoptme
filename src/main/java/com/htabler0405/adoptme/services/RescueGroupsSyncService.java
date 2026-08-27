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
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
public class RescueGroupsSyncService {

    private final RestClient rescueGroupsRestClient;
    private final AnimalShelterRepository shelterRepository;
    private final AnimalProfileRepository animalRepository;
    private final GeometryFactory geometryFactory;

    // Comprehensive major US metropolitan hubs covering all population centers
    private static final List<String> REGIONAL_HUBS = List.of(
            // Mid-Atlantic & Capital Region
            "20001", // Washington, DC
            "21201", // Baltimore, MD
            "25405", // Martinsburg, WV / Eastern Panhandle
            "19102", // Philadelphia, PA
            "15201", // Pittsburgh, PA

            // Northeast & New England
            "10001", // New York, NY
            "02108", // Boston, MA

            // Southeast & Florida
            "30301", // Atlanta, GA
            "33101", // Miami, FL
            "32801", // Orlando, FL
            "28202", // Charlotte, NC
            "37201", // Nashville, TN

            // Midwest & Great Lakes
            "60601", // Chicago, IL
            "48226", // Detroit, MI
            "43215", // Columbus, OH
            "55401", // Minneapolis, MN
            "63101", // St. Louis, MO
            "64101", // Kansas City, MO

            // South & Texas
            "75201", // Dallas / Fort Worth, TX
            "77002", // Houston, TX
            "78701", // Austin, TX
            "70112", // New Orleans, LA

            // Mountain West & Southwest
            "80201", // Denver, CO
            "85001", // Phoenix, AZ
            "89101", // Las Vegas, NV
            "84101", // Salt Lake City, UT

            // West Coast & Pacific Northwest
            "90001", // Los Angeles, CA
            "94102", // San Francisco / Bay Area, CA
            "92101", // San Diego, CA
            "98101", // Seattle, WA
            "97201"  // Portland, OR
    );

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

    @Async
    public CompletableFuture<Integer> syncNationwideDatabase() {
        log.info("Starting Comprehensive Nationwide Ingestion across {} major metro hubs...", REGIONAL_HUBS.size());
        int grandTotal = 0;
        
        for (String hubZip : REGIONAL_HUBS) {
            try {
                // Fetch up to 5 pages per metro hub (500 animals per metro area)
                int count = syncAnimalsNearZip(hubZip, 75, 5);
                grandTotal += count;
                log.info("Hub {} sync complete (+{} pets). Running total: {}", hubZip, count, grandTotal);
                Thread.sleep(300); // Polite rate-limiting between hubs
            } catch (Exception e) {
                log.error("Failed syncing hub {}: {}", hubZip, e.getMessage());
            }
        }
        
        log.info("Comprehensive Nationwide Ingestion complete! Total records saved/updated: {}", grandTotal);
        return CompletableFuture.completedFuture(grandTotal);
    }

    // 2-argument overload default
    @Transactional
    public int syncAnimalsNearZip(String postalCode, int distanceMiles) {
        return syncAnimalsNearZip(postalCode, distanceMiles, 10);
    }

    // 3-argument execution
    @Transactional
    public int syncAnimalsNearZip(String postalCode, int distanceMiles, int maxPages) {
        log.info("Starting RescueGroups sync near {} ({} mi, up to {} pages)...", postalCode, distanceMiles, maxPages);

        int totalSaved = 0;

        for (int page = 1; page <= maxPages; page++) {
            final int currentPage = page;

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
                log.error("Failed querying RescueGroups page {}: {}", currentPage, e.getMessage());
                break;
            }

            if (response == null || response.data() == null || response.data().isEmpty()) {
                break;
            }

            @SuppressWarnings("null")
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

                    if (shelter == null) continue;

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

            if (response.data().size() < 100) break;

            try {
                Thread.sleep(150);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
        }

        return totalSaved;
    }

    private String detectSpecies(String rawSpecies, String breed) {
        String s = (rawSpecies != null ? rawSpecies.trim().toLowerCase() : "");
        String b = (breed != null ? breed.trim().toLowerCase() : "");
        String combined = (s + " " + b).trim();

        if (s.equals("dog") || s.equals("dogs") || s.equals("canine")) return "Dog";
        if (s.equals("cat") || s.equals("cats") || s.equals("feline")) return "Cat";
        if (s.equals("bird") || s.equals("birds") || s.equals("avian")) return "Bird";
        if (s.equals("rabbit") || s.equals("rabbits")) return "Rabbit";
        if (s.equals("horse") || s.equals("horses") || s.equals("equine")) return "Horse";
        if (s.contains("small") || s.contains("furry") || s.equals("rodent")) return "Small & Furry";

        if (combined.contains("dog") || combined.contains("canine") || combined.contains("shepherd") ||
            combined.contains("poodle") || combined.contains("terrier") || combined.contains("retriever") ||
            combined.contains("hound") || combined.contains("pyrenees") || combined.contains("husky") ||
            combined.contains("collie") || combined.contains("sheepdog") || combined.contains("mastiff") ||
            combined.contains("chihuahua") || combined.contains("pit bull") || combined.contains("bully") ||
            combined.contains("bulldog") || combined.contains("beagle") || combined.contains("boxer") ||
            combined.contains("rottweiler") || combined.contains("corgi") || combined.contains("dachshund") ||
            combined.contains("spaniel") || combined.contains("great dane") || combined.contains("australian shepherd")) {
            return "Dog";
        }

        if (combined.contains("cat") || combined.contains("feline") || combined.contains("kitten") ||
            combined.contains("shorthair") || combined.contains("short hair") || 
            combined.contains("longhair") || combined.contains("long hair") || 
            combined.contains("siamese") || combined.contains("tabby") || 
            combined.contains("persian") || combined.contains("maine coon") ||
            combined.contains("tortoiseshell") || combined.contains("tuxedo") || 
            combined.contains("calico") || combined.contains("domestic short") || 
            combined.contains("domestic medium") || combined.contains("domestic long")) {
            return "Cat";
        }

        if (combined.contains("bird") || combined.contains("pigeon") || combined.contains("dove") ||
            combined.contains("parrot") || combined.contains("parakeet") || combined.contains("cockatiel")) {
            return "Bird";
        }

        if (combined.contains("rabbit") || combined.contains("bunny") || combined.contains("lop")) {
            return "Rabbit";
        }

        if (combined.contains("guinea pig") || combined.contains("hamster") || combined.contains("ferret") ||
            combined.contains("chinchilla") || combined.contains("hedgehog") || combined.contains("gerbil")) {
            return "Small & Furry";
        }

        if (combined.contains("horse") || combined.contains("equine") || combined.contains("pony")) {
            return "Horse";
        }

        if (rawSpecies != null && !rawSpecies.isBlank()) {
            return rawSpecies.substring(0, 1).toUpperCase() + rawSpecies.substring(1).toLowerCase();
        }

        return "Dog";
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