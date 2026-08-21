package com.htabler0405.adoptme.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.htabler0405.adoptme.entities.Shelter;
import com.htabler0405.adoptme.services.ShelterService;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/shelters")
@RestController
public class ShelterController {
    private final ShelterService shelterService;

    public ShelterController(ShelterService shelterService) {
        this.shelterService = shelterService;
    }
    
    @GetMapping
    public ResponseEntity<List<Shelter>> getAllShelters() {
        List<Shelter> allShelters = shelterService.getAllShelters();
        return ResponseEntity.ok(allShelters);
    }

    @GetMapping("/{shelterId}")
    public ResponseEntity<Shelter> getShelterById(@PathVariable Long shelterId) {
        Shelter shelter = shelterService.getShelterById(shelterId);
        return ResponseEntity.ok(shelter);
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<Shelter>> getNearbyShelters(
            @RequestParam String zipCode,
            @RequestParam(defaultValue = "25.0") double radiusMiles) {
        
        List<Shelter> shelters = shelterService.getNearbySheltersByLocation(zipCode, radiusMiles);
        return ResponseEntity.ok(shelters);
    }
}
