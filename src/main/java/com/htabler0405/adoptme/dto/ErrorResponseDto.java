package com.htabler0405.adoptme.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public record ErrorResponseDto(
    int status,
    String message,
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    LocalDateTime timestamp
) {
    public ErrorResponseDto(int status, String message) {
        this(status, message, LocalDateTime.now());
    }
}