package com.htabler0405.adoptme.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
public class ScrapedAnimalDto {
    private String sourceUrl;
    private String name;
    private String species;
    private String breed;
    private String age;
    private String gender;
    private String size;
    private String description;
    private String imageUrl;
    private boolean hypoallergenic;
}