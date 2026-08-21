package com.htabler0405.adoptme.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class FeedbackRequest {

    private Long shelterId;
    private Integer rating;

    // Accepts either "description" or "comment" from JSON
    @JsonAlias("comment")
    private String description;
}