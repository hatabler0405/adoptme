package com.htabler0405.adoptme.services.scraper;

import com.htabler0405.adoptme.entities.AnimalProfile;
import com.htabler0405.adoptme.entities.Shelter;
import com.htabler0405.adoptme.repositories.AnimalProfileRepository;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class AnimalScraperService {

    private final AnimalProfileRepository animalRepository;

    public AnimalScraperService(AnimalProfileRepository animalRepository) {
        this.animalRepository = animalRepository;
    }

    @Transactional
    public void scrapeAnimalsForShelter(Shelter shelter) {
        List<String> urlsToScrape = determineListingUrls(shelter);
        log.info("Starting live public web scrape for shelter '{}' across {} target URLs", shelter.getName(), urlsToScrape.size());

        for (String url : urlsToScrape) {
            scrapePage(url, shelter);
        }
    }

    private List<String> determineListingUrls(Shelter shelter) {
        List<String> urls = new ArrayList<>();
        String name = shelter.getName().toLowerCase();

        if (name.contains("jefferson") || shelter.getWebsiteUrl().contains("awsjc.org")) {
            // Corrected AWSJC URLs
            urls.add("https://www.awsjc.org/adopt-a-dog");
            urls.add("https://www.awsjc.org/adopt-a-cat");
        } else if (name.contains("berkeley") || shelter.getWebsiteUrl().contains("berkeley.wvhumane.com")) {
            // Corrected Berkeley County URL
            urls.add("https://berkeley.wvhumane.com/adopt-a-friend/");
        } else if (shelter.getWebsiteUrl() != null && !shelter.getWebsiteUrl().isBlank()) {
            urls.add(shelter.getWebsiteUrl());
        }

        return urls;
    }

    private void scrapePage(String url, Shelter shelter) {
        log.info("Fetching public HTML from: {}", url);
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AdoptMeApp/1.0 (Public Animal Rescue Indexer)")
                    .timeout(15000)
                    .get();

            // Broad selector targeting pet cards, image blocks, summary items, and articles
            Elements petBlocks = doc.select(".summary-item, article, .sqs-block-image, .pet-card, .animal-card, .entry-content .wp-block-image, div[class*='pet-item']");
            log.info("Found {} candidate blocks on {}", petBlocks.size(), url);

            int savedCount = 0;
            for (Element block : petBlocks) {
                // 1. Extract Name
                Element titleEl = block.selectFirst("h1, h2, h3, h4, .summary-title, .image-title, .pet-name, a.summary-title-link");
                String petName = "";
                if (titleEl != null) {
                    petName = titleEl.text().trim();
                }

                // If no heading, check image alt attribute
                if (petName.isBlank()) {
                    Element imgEl = block.selectFirst("img");
                    if (imgEl != null && imgEl.hasAttr("alt")) {
                        petName = imgEl.attr("alt").trim();
                    }
                }

                // Clean name and skip non-pet generic elements
                petName = sanitizePetName(petName);
                if (petName.isBlank() || petName.length() > 30) {
                    continue;
                }

                // 2. Extract Image URL
                Element imgEl = block.selectFirst("img");
                String imageUrl = "";
                if (imgEl != null) {
                    imageUrl = imgEl.hasAttr("data-src") ? imgEl.attr("data-src") : imgEl.attr("abs:src");
                    if (imageUrl.isBlank()) {
                        imageUrl = imgEl.attr("src");
                    }
                }

                // 3. Extract Description
                Element descEl = block.selectFirst(".summary-excerpt, .description, p, .entry-summary");
                String description = (descEl != null && !descEl.text().isBlank())
                        ? descEl.text().trim()
                        : "Available for adoption at " + shelter.getName() + ". Visit " + url + " for adoption application details.";

                // 4. Determine Species & Gender
                String species = url.toLowerCase().contains("cat") ? "Cat" : "Dog";
                String gender = inferGender(petName + " " + description);

                // 5. Unique Source URL
                Element linkEl = block.selectFirst("a[href]");
                String sourceUrl = (linkEl != null && !linkEl.absUrl("href").isBlank())
                        ? linkEl.absUrl("href")
                        : url + "#" + petName.toLowerCase().replaceAll("[^a-z0-9]", "-");

                // 6. Save or Update in PostgreSQL
                AnimalProfile profile = animalRepository.findBySourceUrl(sourceUrl)
                        .orElseGet(() -> {
                            AnimalProfile p = new AnimalProfile();
                            p.setSourceUrl(sourceUrl);
                            p.setShelter(shelter);
                            return p;
                        });

                profile.setName(petName);
                profile.setSpecies(species);
                profile.setBreed("Mixed Breed");
                profile.setGender(gender);
                profile.setAge("Adult");
                profile.setSize("Medium");
                if (!imageUrl.isBlank()) {
                    profile.setImageUrl(imageUrl);
                }
                profile.setDescription(description);
                profile.setStatus("AVAILABLE");
                profile.setHypoallergenic(false);
                profile.setLastSeenAt(LocalDateTime.now());

                animalRepository.save(profile);
                savedCount++;
                log.info("Saved live scraped animal: '{}' ({}) from {}", petName, species, shelter.getName());
            }

            log.info("Finished parsing {}: persisted {} live animal profiles.", url, savedCount);

        } catch (IOException e) {
            log.error("Failed to scrape live HTML from {}: {}", url, e.getMessage());
        }
    }

    private String sanitizePetName(String raw) {
        if (raw == null) return "";
        String cleaned = raw.replaceAll("(?i)(adoptable|available|featured|dog|cat|for adoption|meet|\\|)", "").trim();
        if (cleaned.equalsIgnoreCase("donate") || cleaned.equalsIgnoreCase("foster") || cleaned.equalsIgnoreCase("home")) {
            return "";
        }
        return cleaned;
    }

    private String inferGender(String text) {
        String upper = text.toUpperCase();
        if (upper.contains(" FEMALE ") || upper.contains(" SHE ") || upper.contains(" HER ") || upper.contains(" GIRL ")) {
            return "FEMALE";
        } else if (upper.contains(" MALE ") || upper.contains(" HE ") || upper.contains(" HIM ") || upper.contains(" BOY ")) {
            return "MALE";
        }
        return "UNKNOWN";
    }
}