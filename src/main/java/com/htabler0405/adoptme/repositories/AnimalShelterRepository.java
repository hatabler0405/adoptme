package com.htabler0405.adoptme.repositories;

import com.htabler0405.adoptme.entities.Shelter;
import com.htabler0405.adoptme.sources.SourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnimalShelterRepository extends JpaRepository<Shelter, Long> {

    List<Shelter> findBySourcetype(SourceType sourcetype); 

    @Query(value = "SELECT * FROM shelters WHERE ST_DWithin(" +
                   "CAST(location AS geography), " +
                   "CAST(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) AS geography), " +
                   ":radiusMeters)", 
           nativeQuery = true)
    List<Shelter> findNearbyShelters(@Param("lat") double lat, 
                                     @Param("lng") double lng, 
                                     @Param("radiusMeters") double radiusMeters);

    Optional<Shelter> findByName(String name);
    Optional<Shelter> findByRescuegroupsOrgId(Long rescuegroupsOrgId);
}