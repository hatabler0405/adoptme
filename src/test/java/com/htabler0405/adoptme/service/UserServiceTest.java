package com.htabler0405.adoptme.service;

import com.htabler0405.adoptme.entities.User;
import com.htabler0405.adoptme.exceptions.ResourceNotFoundException;
import com.htabler0405.adoptme.repositories.UserRepository;
import com.htabler0405.adoptme.services.UserAccountOptionsService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserAccountOptionsServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserAccountOptionsService service;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("hunter");
        testUser.setEmail("hunter@example.com");
        testUser.setPassword("encoded_hash");
    }

    @Test
    void updateUsername_ValidCredentials_SavesNewUsername() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("raw_pass", "encoded_hash")).thenReturn(true);

        service.updateUsername(1L, "raw_pass", "new_hunter");

        assertEquals("new_hunter", testUser.getUsername());
        verify(userRepository).save(testUser);
    }

    @Test
    void updateUsername_InvalidPassword_ThrowsIllegalArgumentException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("bad_pass", "encoded_hash")).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () ->
                service.updateUsername(1L, "bad_pass", "new_hunter")
        );

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void updateUsername_UserNotFound_ThrowsResourceNotFoundException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                service.updateUsername(99L, "pass", "new_name")
        );
    }
}