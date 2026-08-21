package com.htabler0405.adoptme.dto;

import com.htabler0405.adoptme.sources.SourceType;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class AnimalFilterRequest{
    private String description;
    private String species;
    private String breed;
    private String size;
    private String color;
    private Boolean hypoallergenic;
    private SourceType sourceType;
    private String zipCode;
    private Double latitude;
    private Double longitude;
    private Double radiusMiles;
    private String gender;
    private String age;
}