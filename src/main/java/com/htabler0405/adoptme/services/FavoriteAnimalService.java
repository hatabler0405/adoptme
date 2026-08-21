package com.htabler0405.adoptme.services;

import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.htabler0405.adoptme.repositories.AnimalProfileRepository;
import com.htabler0405.adoptme.repositories.UserRepository;
import com.htabler0405.adoptme.dto.AnimalResponseDto;
import com.htabler0405.adoptme.entities.AnimalProfile;
import com.htabler0405.adoptme.entities.User;
import com.htabler0405.adoptme.exceptions.ResourceNotFoundException;

@Service
public class FavoriteAnimalService {
    private final AnimalProfileRepository animalProfileRepository;
    private final UserRepository userRepository;

    public FavoriteAnimalService(AnimalProfileRepository animalProfileRepository, UserRepository userRepository) {
        this.animalProfileRepository = animalProfileRepository;
        this.userRepository = userRepository;
    }
    @Transactional
    public void addFavoriteAnimal(Long userId, Long petId){
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        AnimalProfile animal = animalProfileRepository.findById(petId)
            .orElseThrow(() -> new ResourceNotFoundException("Animal not found with id: " + petId));
        
        user.getFavoriteAnimals().add(animal);

    }
    @Transactional
    public void removeFavoriteAnimal(Long userId, Long petId){
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        AnimalProfile animal = animalProfileRepository.findById(petId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + petId));
        
        user.getFavoriteAnimals().remove(animal);

    }

    @Transactional(readOnly = true)
    public  List<AnimalResponseDto> getUserFavoriteAnimal(Long userId){
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    
        Set<AnimalProfile> favorites = user.getFavoriteAnimals();
        return favorites.stream()
                .map(AnimalResponseDto::new)
                .toList();
    }
    

}
