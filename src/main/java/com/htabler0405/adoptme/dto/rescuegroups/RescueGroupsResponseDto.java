package com.htabler0405.adoptme.dto.rescuegroups;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record RescueGroupsResponseDto(
    List<RescueGroupsAnimalData> data,
    List<RescueGroupsIncludedItem> included
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RescueGroupsAnimalData(
        String id,
        String type,
        AnimalAttributes attributes,
        AnimalRelationships relationships
    ) {
        @JsonIgnoreProperties(ignoreUnknown = true)
        public record AnimalAttributes(
            String name,
            String breedPrimary,
            String breedString,
            String species,
            String sex,
            String ageGroup,
            String ageString,
            String sizeGroup,
            String descriptionText,
            String descriptionHtml,
            String adoptionFeeString,
            @JsonProperty("isHypoallergenic") Boolean hypoallergenic,
            @JsonProperty("isGoodWithKids") Boolean goodWithKids,
            @JsonProperty("isGoodWithDogs") Boolean goodWithDogs,
            @JsonProperty("isGoodWithCats") Boolean goodWithCats,
            String url
        ) {}

        @JsonIgnoreProperties(ignoreUnknown = true)
        public record AnimalRelationships(
            OrgRelationship orgs,
            PictureRelationship pictures
        ) {}

        @JsonIgnoreProperties(ignoreUnknown = true)
        public record OrgRelationship(
            List<RelationshipData> data
        ) {}

        @JsonIgnoreProperties(ignoreUnknown = true)
        public record PictureRelationship(
            List<RelationshipData> data
        ) {}

        @JsonIgnoreProperties(ignoreUnknown = true)
        public record RelationshipData(
            String id,
            String type
        ) {}
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RescueGroupsIncludedItem(
        String id,
        String type,
        IncludedAttributes attributes
    ) {
        @JsonIgnoreProperties(ignoreUnknown = true)
        public record IncludedAttributes(
            String name,
            String email,
            String phone,
            String street,
            String city,
            String state,
            String postalcode,
            String url,
            Double lat,
            Double lon,
            @JsonProperty("original") Map<String, Object> original,
            @JsonProperty("large") Map<String, Object> large
        ) {}
    }
}