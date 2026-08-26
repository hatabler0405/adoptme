package com.htabler0405.adoptme.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

import com.htabler0405.adoptme.sources.SourceType;

@Data
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AnimalFilterRequest {
    // Basic text search & identifiers
    private String name;
    private String breed;
    private String species;
    private String gender;
    private String size;
    private String color;
    private SourceType sourceType;
    private Long shelterId;

    // Age & Budget
    private Integer minAge;
    private Integer maxAge;
    private String age; // "Baby", "Young", "Adult", "Senior"
    private BigDecimal maxAdoptionFee;

    // Spatial & Location
    private String zipCode;
    private Double radiusMiles;
    private Double latitude;
    private Double longitude;

    // Health & Compatibility Flags
    private Boolean hypoallergenic;
    private Boolean goodWithKids;
    private Boolean goodWithDogs;
    private Boolean goodWithCats;
    private Boolean houseTrained;
    private Boolean specialNeeds;

    // Status
    private String status;
}