package com.htabler0405.adoptme.services;

import com.htabler0405.adoptme.dto.InteractionDto;
import com.htabler0405.adoptme.dto.RecommendationRequestDto;
import com.htabler0405.adoptme.dto.RecommendationResponseDto;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Collections;

@Service
public class RecommendationClientService {

    private final RestClient restClient;

    public RecommendationClientService() {
        this.restClient = RestClient.builder()
                .baseUrl("https://adoptme-recommendation-engine.onrender.com")
                .build();
    }

    public List<Long> getRecommendedPetIds(Long userId, List<InteractionDto> interactions) {
        RecommendationRequestDto requestPayload = new RecommendationRequestDto(userId, interactions, 15);

        try {
            RecommendationResponseDto response = restClient.post()
                    .uri("/api/recommendations")
                    .body(requestPayload)
                    .retrieve()
                    .body(RecommendationResponseDto.class);

            return response != null ? response.recommendedPetIds() : Collections.emptyList();
            
        } catch (Exception e) {
            System.err.println("Python microservice offline or errored. Returning empty list. Error: " + e.getMessage());
            return Collections.emptyList();
        }
    }
}