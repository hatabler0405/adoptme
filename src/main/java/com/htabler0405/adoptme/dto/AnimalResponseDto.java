package com.htabler0405.adoptme.dto;

import java.math.BigDecimal;

import com.htabler0405.adoptme.entities.AnimalProfile;
import com.htabler0405.adoptme.entities.Shelter;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@Getter
@Setter
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnimalResponseDto {
    private Long id;
    private String name;
    private String breed;
    private String species;
    private String gender;
    private String age;
    private String size;
    private String color;
    private String imageUrl;
    private Boolean hypoallergenic;
    private Boolean goodWithKids;
    private Boolean goodWithDogs;
    private Boolean goodWithCats;
    private BigDecimal adoptionFee;

    // Shelter details
    private Long shelterId;
    private String shelterName;
    private Double shelterLatitude;
    private Double shelterLongitude;
    private String adoptionUrl;

    public AnimalResponseDto(AnimalProfile animal) {
        this.id = animal.getId();
        this.name = animal.getName();
        this.breed = animal.getBreed();
        this.species = animal.getSpecies();
        this.gender = animal.getGender();
        this.age = animal.getAge();
        this.size = animal.getSize();
        this.color = animal.getColor();
        this.imageUrl = animal.getImageUrl();
        this.hypoallergenic = animal.getHypoallergenic();
        this.goodWithKids = animal.getGoodWithKids();
        this.goodWithDogs = animal.getGoodWithDogs();
        this.goodWithCats = animal.getGoodWithCats();
        this.adoptionFee = animal.getAdoptionFee();

        Shelter shelter = animal.getShelter();
        if (shelter != null) {
            this.shelterId = shelter.getId();
            this.shelterName = shelter.getName();
            this.adoptionUrl = shelter.getAdoptionListingsUrl();
            
            if (shelter.getLocation() != null && animal.getShelter().getLocation() != null) {
                this.shelterLongitude = shelter.getLocation().getCoordinate().x;
                this.shelterLatitude = shelter.getLocation().getCoordinate().y;
            }
        }
    }
}