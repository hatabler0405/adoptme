package com.htabler0405.adoptme.repositories;

import com.htabler0405.adoptme.entities.AnimalProfile;
import com.htabler0405.adoptme.entities.Shelter;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface AnimalProfileRepository extends JpaRepository<AnimalProfile, Long>, JpaSpecificationExecutor<AnimalProfile> {

    List<AnimalProfile> findByBreed(String breed);

    List<AnimalProfile> findBySizeAndBreed(String size, String breed); 

    List<AnimalProfile> findByHypoallergenic(Boolean hypoallergenic);

    List<AnimalProfile> findByShelterId(Long shelterId);

    boolean existsByNameAndShelterId(String name, Long shelterId);

    boolean existsByNameIgnoreCaseAndShelterId(String name, Long shelterId);

    @Modifying
    @Query("UPDATE AnimalProfile a SET a.status = 'ADOPTED', a.statusChangedAt = :now " +
           "WHERE a.shelter = :shelter AND a.status = 'AVAILABLE' AND a.sourceUrl NOT IN :activeUrls")
    int markMissingAnimalsAsAdopted(
            @Param("shelter") Shelter shelter,
            @Param("activeUrls") Set<String> activeUrls,
            @Param("now") LocalDateTime now
    );

    Optional<AnimalProfile> findBySourceUrl(String sourceUrl);

    @Query(value = """
        SELECT a.* FROM animal_profiles a
        JOIN shelters s ON a.shelter_id = s.id
        WHERE ST_DWithin(
            s.location::geography,
            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
            (:radiusMiles * 1609.344)
        )
        AND a.status = 'AVAILABLE'
    """, nativeQuery = true)
    List<AnimalProfile> searchByLocation(
            @Param("longitude") double longitude,
            @Param("latitude") double latitude,
            @Param("radiusMiles") double radiusMiles
    );
    Optional<AnimalProfile> findByRescuegroupsPetId(Long rescuegroupsPetId);

    // 1. Strict Radius Search (PostGIS ST_DWithin + ST_Distance)
    @Query(value = """
        SELECT a.* FROM animal_profiles a
        INNER JOIN shelters s ON a.shelter_id = s.id
        WHERE s.location IS NOT NULL
          AND (:species IS NULL OR LOWER(a.species) = LOWER(:species))
          AND (:gender IS NULL OR UPPER(a.gender) = UPPER(:gender))
          AND (:size IS NULL OR LOWER(a.size) = LOWER(:size))
          AND (:breed IS NULL OR LOWER(a.breed) LIKE LOWER(CONCAT('%', :breed, '%')))
          AND (:name IS NULL OR LOWER(a.name) LIKE LOWER(CONCAT('%', :name, '%')))
          AND (:goodWithKids IS NULL OR a.good_with_kids = :goodWithKids)
          AND (:goodWithDogs IS NULL OR a.good_with_dogs = :goodWithDogs)
          AND (:goodWithCats IS NULL OR a.good_with_cats = :goodWithCats)
          AND (a.status IS NULL OR UPPER(a.status) = 'AVAILABLE')
          AND ST_DWithin(
                s.location::geography,
                ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
                (:radiusMiles * 1609.344)
          )
        ORDER BY ST_Distance(
                s.location::geography,
                ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
        ) ASC
        """,
        countQuery = """
        SELECT count(a.id) FROM animal_profiles a
        INNER JOIN shelters s ON a.shelter_id = s.id
        WHERE s.location IS NOT NULL
          AND (:species IS NULL OR LOWER(a.species) = LOWER(:species))
          AND (:gender IS NULL OR UPPER(a.gender) = UPPER(:gender))
          AND (:size IS NULL OR LOWER(a.size) = LOWER(:size))
          AND (:breed IS NULL OR LOWER(a.breed) LIKE LOWER(CONCAT('%', :breed, '%')))
          AND (:name IS NULL OR LOWER(a.name) LIKE LOWER(CONCAT('%', :name, '%')))
          AND (:goodWithKids IS NULL OR a.good_with_kids = :goodWithKids)
          AND (:goodWithDogs IS NULL OR a.good_with_dogs = :goodWithDogs)
          AND (:goodWithCats IS NULL OR a.good_with_cats = :goodWithCats)
          AND (a.status IS NULL OR UPPER(a.status) = 'AVAILABLE')
          AND ST_DWithin(
                s.location::geography,
                ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
                (:radiusMiles * 1609.344)
          )
        """,
        nativeQuery = true)
    Page<AnimalProfile> findNearbyWithFilters(
            @Param("lat") double lat,
            @Param("lon") double lon,
            @Param("radiusMiles") double radiusMiles,
            @Param("species") String species,
            @Param("gender") String gender,
            @Param("size") String size,
            @Param("breed") String breed,
            @Param("name") String name,
            @Param("goodWithKids") Boolean goodWithKids,
            @Param("goodWithDogs") Boolean goodWithDogs,
            @Param("goodWithCats") Boolean goodWithCats,
            Pageable pageable
    );

    // 2. Any Distance Proximity Sort (Nearest pets first)
    @Query(value = """
        SELECT a.* FROM animal_profiles a
        LEFT JOIN shelters s ON a.shelter_id = s.id
        WHERE (:species IS NULL OR LOWER(a.species) = LOWER(:species))
          AND (:gender IS NULL OR UPPER(a.gender) = UPPER(:gender))
          AND (:size IS NULL OR LOWER(a.size) = LOWER(:size))
          AND (:breed IS NULL OR LOWER(a.breed) LIKE LOWER(CONCAT('%', :breed, '%')))
          AND (:name IS NULL OR LOWER(a.name) LIKE LOWER(CONCAT('%', :name, '%')))
          AND (:goodWithKids IS NULL OR a.good_with_kids = :goodWithKids)
          AND (:goodWithDogs IS NULL OR a.good_with_dogs = :goodWithDogs)
          AND (:goodWithCats IS NULL OR a.good_with_cats = :goodWithCats)
          AND (a.status IS NULL OR UPPER(a.status) = 'AVAILABLE')
        ORDER BY 
          CASE WHEN s.location IS NOT NULL THEN
            ST_Distance(s.location::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography)
          ELSE 99999999 END ASC,
          a.id DESC
        """,
        countQuery = """
        SELECT count(a.id) FROM animal_profiles a
        LEFT JOIN shelters s ON a.shelter_id = s.id
        WHERE (:species IS NULL OR LOWER(a.species) = LOWER(:species))
          AND (:gender IS NULL OR UPPER(a.gender) = UPPER(:gender))
          AND (:size IS NULL OR LOWER(a.size) = LOWER(:size))
          AND (:breed IS NULL OR LOWER(a.breed) LIKE LOWER(CONCAT('%', :breed, '%')))
          AND (:name IS NULL OR LOWER(a.name) LIKE LOWER(CONCAT('%', :name, '%')))
          AND (:goodWithKids IS NULL OR a.good_with_kids = :goodWithKids)
          AND (:goodWithDogs IS NULL OR a.good_with_dogs = :goodWithDogs)
          AND (:goodWithCats IS NULL OR a.good_with_cats = :goodWithCats)
          AND (a.status IS NULL OR UPPER(a.status) = 'AVAILABLE')
        """,
        nativeQuery = true)
    Page<AnimalProfile> findAllSortedByDistance(
            @Param("lat") double lat,
            @Param("lon") double lon,
            @Param("species") String species,
            @Param("gender") String gender,
            @Param("size") String size,
            @Param("breed") String breed,
            @Param("name") String name,
            @Param("goodWithKids") Boolean goodWithKids,
            @Param("goodWithDogs") Boolean goodWithDogs,
            @Param("goodWithCats") Boolean goodWithCats,
            Pageable pageable
    );
}