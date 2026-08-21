package com.htabler0405.adoptme.dto;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FeedbackResponse {
    private Long id;
    private String description;
    private Integer rating;
    private LocalDateTime createdAt;
    private Long userId;
    private String username;
    private Long shelterId;
    private String shelterName;
}