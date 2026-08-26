package com.htabler0405.adoptme.repositories;

import com.htabler0405.adoptme.entities.AnimalProfile;
import com.htabler0405.adoptme.entities.Shelter;

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
}