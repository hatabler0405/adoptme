package com.htabler0405.adoptme.services;

import com.htabler0405.adoptme.entities.Shelter;
import com.htabler0405.adoptme.repositories.AnimalShelterRepository;

import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
public class ShelterService {
    private final AnimalShelterRepository animalShelterRepository;
    private final GeocodingService geocodingService;

    public ShelterService(AnimalShelterRepository animalShelterRepository, GeocodingService geocodingService){
        this.animalShelterRepository = animalShelterRepository;
        this.geocodingService = geocodingService;
    }

    @Transactional(readOnly = true)
    public List<Shelter> getAllShelters(){
        return animalShelterRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Shelter getShelterById(Long shelterId){
        return animalShelterRepository.findById(shelterId)
            .orElseThrow(() -> new RuntimeException("Shelter not found with id: " + shelterId));
    }

    @Transactional(readOnly = true)
    public List<Shelter> getNearbySheltersByLocation(String zipOrAddress, double radiusMiles) {
            Point userPoint = geocodingService.getCoordinatesFromAddressOrZip(zipOrAddress);
            if (userPoint == null) {
                return Collections.emptyList();
            }
            double lng = userPoint.getCoordinate().x;
            double lat = userPoint.getCoordinate().y;
            double radiusMeters = radiusMiles * 1609.34; 

            return animalShelterRepository.findNearbyShelters(lat, lng, radiusMeters);
    }
}