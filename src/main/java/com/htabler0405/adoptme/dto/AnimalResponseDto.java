package com.htabler0405.adoptme.dto;

import com.htabler0405.adoptme.entities.AnimalProfile;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnimalResponseDto {
    private Long id;
    private String name;
    private String species;
    private String breed;
    private String age;
    private String gender;
    private String size;
    private String description;
    private String imageUrl;
    private boolean hypoallergenic;
    private String status;
    private String sourceUrl;
    private LocalDateTime lastSeenAt;

    // Shelter details
    private Long shelterId;
    private String shelterName;
    private String shelterAddress;
    private String shelterPhone;
    private String shelterEmail;
    private String shelterWebsite;

    public AnimalResponseDto(AnimalProfile animal) {
        this.id = animal.getId();
        this.name = animal.getName();
        this.species = animal.getSpecies();
        this.breed = animal.getBreed();
        this.age = animal.getAge();
        this.gender = animal.getGender();
        this.size = animal.getSize();
        this.description = animal.getDescription();
        this.imageUrl = animal.getImageUrl();
        this.hypoallergenic = Boolean.TRUE.equals(animal.getHypoallergenic());
        this.status = animal.getStatus();
        this.sourceUrl = animal.getSourceUrl();
        this.lastSeenAt = animal.getLastSeenAt();

        if (animal.getShelter() != null) {
            this.shelterId = animal.getShelter().getId();
            this.shelterName = animal.getShelter().getName();
            this.shelterAddress = animal.getShelter().getAddress();
            this.shelterPhone = animal.getShelter().getPhoneNumber();
            this.shelterEmail = animal.getShelter().getEmail();
            this.shelterWebsite = animal.getShelter().getWebsiteUrl();
        }
    }
}