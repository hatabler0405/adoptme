package com.htabler0405.adoptme.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.htabler0405.adoptme.controllers.UserController;
import com.htabler0405.adoptme.dto.UpdatePasswordRequest;
import com.htabler0405.adoptme.dto.UpdateUsernameRequest;
import com.htabler0405.adoptme.exceptions.GlobalExceptionHandler;
import com.htabler0405.adoptme.services.UserAccountOptionsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.security.Principal;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private UserAccountOptionsService accountOptionsService;

    @InjectMocks
    private UserController userController;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("PATCH /api/users/update/username - Success 204")
    void updateUsername_Success() throws Exception {
        UpdateUsernameRequest request = new UpdateUsernameRequest();
        request.setCurrentPassword("SecurePassword123!");
        request.setNewUsername("hunter_updated");

        Principal mockPrincipal = () -> "1";

        mockMvc.perform(patch("/api/users/update/username")
                        .principal(mockPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        verify(accountOptionsService, times(1))
                .updateUsername(eq(1L), eq("SecurePassword123!"), eq("hunter_updated"));
    }

    @Test
    @DisplayName("PATCH /api/users/update/username - Incorrect Password 400")
    void updateUsername_InvalidPassword_Returns400() throws Exception {
        UpdateUsernameRequest request = new UpdateUsernameRequest();
        request.setCurrentPassword("WrongPassword!");
        request.setNewUsername("hunter_updated");

        Principal mockPrincipal = () -> "1";

        doThrow(new IllegalArgumentException("Incorrect current password."))
                .when(accountOptionsService)
                .updateUsername(1L, "WrongPassword!", "hunter_updated");

        mockMvc.perform(patch("/api/users/update/username")
                        .principal(mockPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PATCH /api/users/update/password - Success 204")
    void updatePassword_Success() throws Exception {
        UpdatePasswordRequest request = new UpdatePasswordRequest();
        request.setCurrentPassword("SecurePassword123!");
        request.setNewPassword("BrandNewPassword456!");

        Principal mockPrincipal = () -> "1";

        mockMvc.perform(patch("/api/users/update/password")
                        .principal(mockPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        verify(accountOptionsService, times(1))
                .updatePassword(eq(1L), eq("SecurePassword123!"), eq("BrandNewPassword456!"));
    }
}