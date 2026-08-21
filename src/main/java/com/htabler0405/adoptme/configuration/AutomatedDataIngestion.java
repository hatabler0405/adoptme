package com.htabler0405.adoptme.configuration;

import com.htabler0405.adoptme.entities.Shelter;
import com.htabler0405.adoptme.repositories.AnimalShelterRepository;
import com.htabler0405.adoptme.services.scraper.AnimalScraperService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import java.util.List;

@Configuration
@EnableScheduling
public class AutomatedDataIngestion {
/* 
   private static final Logger log = LoggerFactory.getLogger(AutomatedDataIngestion.class);

    private final AnimalScraperService animalScraperService;
    private final AnimalShelterRepository shelterRepository;

    public AutomatedDataIngestion(AnimalScraperService animalScraperService,
                                  AnimalShelterRepository shelterRepository) {
        this.animalScraperService = animalScraperService;
        this.shelterRepository = shelterRepository;
    }

    @Bean
    public CommandLineRunner runOnStartup() {
        return args -> {
            log.info("Starting automated shelter discovery and pet ingestion...");
            runFullSyncPipeline();
        };
    }

    @Scheduled(fixedRate = 43200000, initialDelay = 43200000) // Runs every 12 hours
    public void runFullSyncPipeline() {
        List<Shelter> allShelters = shelterRepository.findAll();
        log.info("Starting listing scrapes across {} registered shelters", allShelters.size());

        for (Shelter shelter : allShelters) {
            try {
                animalScraperService.scrapeAnimalsForShelter(shelter);
            } catch (Exception e) {
                log.error("Failed to scrape animals for {}: {}", shelter.getName(), e.getMessage());
            }
        }
    }
*/
}