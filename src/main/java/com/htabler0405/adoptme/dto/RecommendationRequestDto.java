package com.htabler0405.adoptme.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record RecommendationRequestDto(
    @JsonProperty("user_id") Long userId,
    List<InteractionDto> interactions,
    @JsonProperty("top_n") int topN
) {}