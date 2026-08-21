package com.htabler0405.adoptme.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.htabler0405.adoptme.dto.FeedbackRequest;
import com.htabler0405.adoptme.dto.FeedbackResponse;
import com.htabler0405.adoptme.entities.User;
import com.htabler0405.adoptme.services.FeedbackService;
import com.htabler0405.adoptme.repositories.UserRepository;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;
    private final UserRepository userRepository;

    public FeedbackController(FeedbackService feedbackService, UserRepository userRepository) {
        this.feedbackService = feedbackService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<FeedbackResponse>> getFeedback() {
        return ResponseEntity.ok(feedbackService.getFeedback());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<FeedbackResponse>> getUserFeedback(@PathVariable Long userId) {
        return ResponseEntity.ok(feedbackService.getFeedbackForUser(userId));
    }

    @GetMapping("/shelter/{shelterId}")
    public ResponseEntity<List<FeedbackResponse>> getShelterFeedback(@PathVariable Long shelterId) {
        return ResponseEntity.ok(feedbackService.getFeedbackForShelter(shelterId));
    }

    @PostMapping
    public ResponseEntity<FeedbackResponse> submitFeedback(
            @RequestBody FeedbackRequest request,
            Authentication authentication) {

        Long userId = null;

        if (authentication != null && authentication.getPrincipal() != null) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof Long) {
                userId = (Long) principal;
            } else if (principal instanceof User) {
                userId = ((User) principal).getId();
            } else if (principal instanceof String) {
                userRepository.findByEmail((String) principal)
                    .ifPresent(u -> {});
            }
        }

        FeedbackResponse saved = feedbackService.addFeedback(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}