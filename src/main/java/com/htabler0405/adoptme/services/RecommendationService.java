// src/main/java/com/htabler0405/adoptme/services/RecommendationService.java
package com.htabler0405.adoptme.services;

import com.htabler0405.adoptme.dto.AnimalResponseDto;
import com.htabler0405.adoptme.dto.InteractionDto;
import com.htabler0405.adoptme.entities.AnimalProfile;
import com.htabler0405.adoptme.entities.User;
import com.htabler0405.adoptme.repositories.AnimalProfileRepository;
import com.htabler0405.adoptme.repositories.UserRepository;
import com.htabler0405.adoptme.exceptions.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private final RecommendationClientService clientService;
    private final AnimalProfileRepository animalRepository;
    private final UserRepository userRepository;

    public RecommendationService(RecommendationClientService clientService, 
                                 AnimalProfileRepository animalRepository, 
                                 UserRepository userRepository) {
        this.clientService = clientService;
        this.animalRepository = animalRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<AnimalResponseDto> getUserRecommendations(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        List<InteractionDto> interactions = user.getFavoriteAnimals().stream()
                .map(pet -> new InteractionDto(pet.getId(), "FAVORITE"))
                .collect(Collectors.toList());

        List<Long> rankedIds = clientService.getRecommendedPetIds(userId, interactions);

        if (rankedIds.isEmpty()) return List.of();

        List<AnimalProfile> unorderedProfiles = animalRepository.findAllById(rankedIds);

        Map<Long, AnimalProfile> profileMap = unorderedProfiles.stream()
                .collect(Collectors.toMap(AnimalProfile::getId, p -> p));

        return rankedIds.stream()
                .map(profileMap::get)
                .filter(Objects::nonNull)
                .map(AnimalResponseDto::new)
                .collect(Collectors.toList());
    }
}