package com.htabler0405.adoptme.components;

import com.htabler0405.adoptme.entities.Shelter;
import com.htabler0405.adoptme.repositories.AnimalShelterRepository;
import com.htabler0405.adoptme.sources.SourceType;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class ShelterDatabaseInitializer implements CommandLineRunner {

    private final AnimalShelterRepository shelterRepository;
    private final GeometryFactory geometryFactory;

    public ShelterDatabaseInitializer(AnimalShelterRepository shelterRepository, GeometryFactory geometryFactory) {
        this.shelterRepository = shelterRepository;
        this.geometryFactory = geometryFactory;
    }

    @Override
    public void run(String... args) {
        if (shelterRepository.count() == 0) {
            // 1. Berkeley County Humane Society
            Point loc1 = geometryFactory.createPoint(new Coordinate(-77.9482, 39.4312));
            Shelter s1 = new Shelter();
            s1.setName("Berkeley County Humane Society");
            s1.setAddress("554 Charles Town Rd, Martinsburg, WV");
            s1.setZipCode("25405");
            s1.setPhoneNumber("304-267-8389");
            s1.setEmail("berkeleycountyhumanesociety@gmail.com");
            s1.setWebsiteUrl("https://berkeley.wvhumane.com");
            s1.setSourcetype(SourceType.SHELTER);
            s1.setLocation(loc1);
            shelterRepository.save(s1);

            // 2. Animal Welfare Society of Jefferson County
            Point loc2 = geometryFactory.createPoint(new Coordinate(-77.8597, 39.3498));
            Shelter s2 = new Shelter();
            s2.setName("Animal Welfare Society of Jefferson County");
            s2.setAddress("23 Poor Farm Rd, Kearneysville, WV");
            s2.setZipCode("25430");
            s2.setPhoneNumber("304-725-0589");
            s2.setEmail("awsmanager@awsjc.org");
            s2.setWebsiteUrl("https://www.awsjc.org");
            s2.setSourcetype(SourceType.SHELTER);
            s2.setLocation(loc2);
            shelterRepository.save(s2);
        }
    }
}