package com.htabler0405.adoptme.services;

import com.htabler0405.adoptme.dto.AnimalFilterRequest;
import com.htabler0405.adoptme.entities.AnimalProfile;
import com.htabler0405.adoptme.repositories.AnimalProfileRepository;
import jakarta.persistence.criteria.Predicate;
import org.locationtech.jts.geom.Point;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
    public Page<AnimalProfile> filterAnimals(AnimalFilterRequest filter, Pageable pageable) {
        Double userLat = filter.getLatitude();
        Double userLng = filter.getLongitude();

        // Fallback geocode only if coordinates are missing and ZIP is valid (5 digits)
        if ((userLat == null || userLng == null) && (filter.getZipCode() != null && filter.getZipCode().trim().length() == 5)) {
            Point userPoint = geocodingService.getCoordinatesFromAddressOrZip(filter.getZipCode());
            if (userPoint != null) {
                double val1 = userPoint.getCoordinate().x;
                double val2 = userPoint.getCoordinate().y;
                userLat = (val1 > 0) ? val1 : val2;
                userLng = (val1 < 0) ? val1 : val2;
            }
        }

        // Clean unpaged sort so Spring Data doesn't append a second "ORDER BY" clause
        Pageable cleanPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());

        // 1. Strict Radius Search (PostGIS ST_DWithin + ST_Distance)
        if (userLat != null && userLng != null && filter.getRadiusMiles() != null && filter.getRadiusMiles() > 0) {
            return animalRepository.findNearbyWithFilters(
                    userLat,
                    userLng,
                    filter.getRadiusMiles(),
                    emptyToNull(filter.getSpecies()),
                    emptyToNull(filter.getGender()),
                    emptyToNull(filter.getSize()),
                    emptyToNull(filter.getBreed()),
                    emptyToNull(filter.getName()),
                    filter.getGoodWithKids(),
                    filter.getGoodWithDogs(),
                    filter.getGoodWithCats(),
                    cleanPageable
            );
        }

        // 2. Any Distance with user coordinates (PostGIS ST_Distance proximity sorting)
        if (userLat != null && userLng != null) {
            return animalRepository.findAllSortedByDistance(
                    userLat,
                    userLng,
                    emptyToNull(filter.getSpecies()),
                    emptyToNull(filter.getGender()),
                    emptyToNull(filter.getSize()),
                    emptyToNull(filter.getBreed()),
                    emptyToNull(filter.getName()),
                    filter.getGoodWithKids(),
                    filter.getGoodWithDogs(),
                    filter.getGoodWithCats(),
                    cleanPageable
            );
        }

        // 3. Fallback specification when no coordinates exist
        Specification<AnimalProfile> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getSpecies() != null && !filter.getSpecies().isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("species")), filter.getSpecies().toLowerCase()));
            }
            if (filter.getGender() != null && !filter.getGender().isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("gender")), filter.getGender().toUpperCase()));
            }
            if (filter.getSize() != null && !filter.getSize().isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("size")), filter.getSize().toLowerCase()));
            }
            if (filter.getBreed() != null && !filter.getBreed().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("breed")), "%" + filter.getBreed().toLowerCase() + "%"));
            }
            if (filter.getName() != null && !filter.getName().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + filter.getName().toLowerCase() + "%"));
            }
            if (Boolean.TRUE.equals(filter.getGoodWithKids())) predicates.add(cb.isTrue(root.get("goodWithKids")));
            if (Boolean.TRUE.equals(filter.getGoodWithDogs())) predicates.add(cb.isTrue(root.get("goodWithDogs")));
            if (Boolean.TRUE.equals(filter.getGoodWithCats())) predicates.add(cb.isTrue(root.get("goodWithCats")));

            predicates.add(cb.or(
                    cb.isNull(root.get("status")),
                    cb.equal(cb.upper(root.get("status")), "AVAILABLE")
            ));

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return animalRepository.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    public Optional<AnimalProfile> findAnimalById(Long animalId) {
        return animalRepository.findById(animalId);
    }

    private String emptyToNull(String val) {
        return (val == null || val.trim().isEmpty()) ? null : val.trim();
    }
}