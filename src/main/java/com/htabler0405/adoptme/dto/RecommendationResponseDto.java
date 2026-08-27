package com.htabler0405.adoptme.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record RecommendationResponseDto(
    @JsonProperty("user_id") Long userId,
    @JsonProperty("recommended_pet_ids") List<Long> recommendedPetIds
) {}