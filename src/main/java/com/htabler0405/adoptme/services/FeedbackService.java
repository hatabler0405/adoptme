package com.htabler0405.adoptme.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.htabler0405.adoptme.dto.FeedbackRequest;
import com.htabler0405.adoptme.dto.FeedbackResponse;
import com.htabler0405.adoptme.entities.Feedback;
import com.htabler0405.adoptme.entities.Shelter;
import com.htabler0405.adoptme.entities.User;
import com.htabler0405.adoptme.repositories.FeedbackRepository;
import com.htabler0405.adoptme.repositories.AnimalShelterRepository;
import com.htabler0405.adoptme.repositories.UserRepository;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final AnimalShelterRepository shelterRepository;
    private final UserRepository userRepository;

    public FeedbackService(
            FeedbackRepository feedbackRepository,
            AnimalShelterRepository shelterRepository,
            UserRepository userRepository) {
        this.feedbackRepository = feedbackRepository;
        this.shelterRepository = shelterRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> getFeedback() {
        return feedbackRepository.findAll().stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> getFeedbackForShelter(Long shelterId) {
        return feedbackRepository.findByShelterIdOrderByCreatedAtDesc(shelterId).stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> getFeedbackForUser(Long userId) {
        return feedbackRepository.findByUserId(userId).stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public FeedbackResponse addFeedback(FeedbackRequest request, Long userId) {
        User user = (userId != null) ? userRepository.findById(userId).orElse(null) : null;

        Shelter shelter = shelterRepository.findById(request.getShelterId())
                .orElseThrow(() -> new RuntimeException("Shelter not found with ID: " + request.getShelterId()));

        Feedback feedback = new Feedback();
        feedback.setDescription(request.getDescription());
        
        int selectedRating = (request.getRating() != null && request.getRating() >= 1 && request.getRating() <= 5)
                ? request.getRating()
                : 5;
        feedback.setRating(selectedRating);

        feedback.setUser(user);
        feedback.setShelter(shelter);
        feedback.setCreatedAt(LocalDateTime.now());

        Feedback savedFeedback = feedbackRepository.save(feedback);
        return toResponseDto(savedFeedback);
    }

    private FeedbackResponse toResponseDto(Feedback feedback) {
        FeedbackResponse response = new FeedbackResponse();
        response.setId(feedback.getId());
        response.setDescription(feedback.getDescription());
        response.setRating(feedback.getRating() != null ? feedback.getRating() : 5);
        response.setCreatedAt(feedback.getCreatedAt());

        if (feedback.getUser() != null) {
            response.setUserId(feedback.getUser().getId());
            response.setUsername(feedback.getUser().getUsername());
        } else {
            response.setUsername("Verified Adopter");
        }

        if (feedback.getShelter() != null) {
            response.setShelterId(feedback.getShelter().getId());
            response.setShelterName(feedback.getShelter().getName());
        }

        return response;
    }
}