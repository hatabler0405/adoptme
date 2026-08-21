package com.htabler0405.adoptme.controllers;

import com.htabler0405.adoptme.entities.Shelter;
import com.htabler0405.adoptme.repositories.AnimalShelterRepository;
import com.htabler0405.adoptme.services.scraper.AnimalScraperService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/admin/ingest")
public class AdminIngestionController {

    private final AnimalScraperService animalScraperService;
    private final AnimalShelterRepository shelterRepository;

    public AdminIngestionController(AnimalScraperService animalScraperService,
                                  AnimalShelterRepository shelterRepository) {
        this.animalScraperService = animalScraperService;
        this.shelterRepository = shelterRepository;
    }

    @PostMapping("/scrape")
    public ResponseEntity<Map<String, Object>> triggerScrapeAll() {
        List<Shelter> shelters = shelterRepository.findAll();
        for (Shelter shelter : shelters) {
            animalScraperService.scrapeAnimalsForShelter(shelter);
        }
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Scrape completed for all registered shelters",
                "sheltersProcessed", shelters.size()
        ));
    }
}