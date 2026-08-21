package com.htabler0405.adoptme.services;

import com.htabler0405.adoptme.dto.AnimalFilterRequest;
import com.htabler0405.adoptme.entities.AnimalProfile;
import com.htabler0405.adoptme.repositories.AnimalProfileRepository;
import jakarta.persistence.criteria.Predicate;
import org.locationtech.jts.geom.Point;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class AnimalQueryService {

    private final AnimalProfileRepository animalRepository;
    private final GeocodingService geocodingService;

    public AnimalQueryService(AnimalProfileRepository animalRepository, GeocodingService geocodingService) {
        this.animalRepository = animalRepository;
        this.geocodingService = geocodingService;
    }

    @Transactional(readOnly = true)
    public List<AnimalProfile> filterAnimals(AnimalFilterRequest filter) {
        Specification<AnimalProfile> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getSpecies() != null && !filter.getSpecies().isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("species")), filter.getSpecies().toLowerCase()));
            }
            if (filter.getGender() != null && !filter.getGender().isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("gender")), filter.getGender().toUpperCase()));
            }
            if (filter.getAge() != null && !filter.getAge().isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("age")), filter.getAge().toLowerCase()));
            }
            if (filter.getBreed() != null && !filter.getBreed().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("breed")), "%" + filter.getBreed().toLowerCase() + "%"));
            }
            if (filter.getSize() != null && !filter.getSize().isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("size")), filter.getSize().toLowerCase()));
            }
            if (filter.getColor() != null && !filter.getColor().isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("color")), filter.getColor().toLowerCase()));
            }        
            if (filter.getSourceType() != null) {
                predicates.add(cb.equal(root.join("shelter").get("sourcetype"), filter.getSourceType()));            
            }
            if (filter.getHypoallergenic() != null) {
                predicates.add(cb.equal(root.get("hypoallergenic"), filter.getHypoallergenic()));          
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<AnimalProfile> result = animalRepository.findAll(spec);

        Double userLat = filter.getLatitude();
        Double userLng = filter.getLongitude();

        if ((userLat == null || userLng == null) && (filter.getZipCode() != null && !filter.getZipCode().isBlank())) {
            Point userPoint = geocodingService.getCoordinatesFromAddressOrZip(filter.getZipCode());
            if (userPoint != null) {
                userLng = userPoint.getCoordinate().x;
                userLat = userPoint.getCoordinate().y;
            }
        }

        if (userLat != null && userLng != null && filter.getRadiusMiles() != null) {
            double finalLat = userLat;
            double finalLng = userLng;
            double maxMiles = filter.getRadiusMiles();

            result = result.stream()
                    .filter(animal -> isWithinRadius(animal, finalLat, finalLng, maxMiles))
                    .toList();
        }

        return result;
    }

    @Transactional(readOnly = true)
    public Optional<AnimalProfile> findAnimalById(Long animalId) {
        return animalRepository.findById(animalId);
    }

    private boolean isWithinRadius(AnimalProfile animal, double userLat, double userLng, double maxDistanceMiles) {
        if (animal.getShelter() == null || animal.getShelter().getLocation() == null) {
            return false;
        }

        Point shelterPoint = animal.getShelter().getLocation();        
        double shelterLng = shelterPoint.getCoordinate().x;
        double shelterLat = shelterPoint.getCoordinate().y;

        double earthRadiusMiles = 3958.8;
        double dLat = Math.toRadians(shelterLat - userLat);
        double dLng = Math.toRadians(shelterLng - userLng);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(userLat)) * Math.cos(Math.toRadians(shelterLat)) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = earthRadiusMiles * c;

        return distance <= maxDistanceMiles;
    }
}