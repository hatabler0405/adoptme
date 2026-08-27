package com.htabler0405.adoptme.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record InteractionDto(
    @JsonProperty("animal_id") Long animalId, 
    @JsonProperty("interaction_type") String interactionType
) {}