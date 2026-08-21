package com.htabler0405.adoptme.services;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.htabler0405.adoptme.exceptions.ResourceNotFoundException;
import com.htabler0405.adoptme.dto.CreateUserRequest;
import com.htabler0405.adoptme.entities.User;
import com.htabler0405.adoptme.repositories.UserRepository;

@Service
public class UserAccountOptionsService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    public UserAccountOptionsService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void createUser(CreateUserRequest request){
    if (userRepository.existsByEmail(request.getEmail())) {
        throw new IllegalArgumentException("Email is already registered: " + request.getEmail());    
    }
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long userId){
        if(!userRepository.existsById(userId)){
            throw new ResourceNotFoundException("User not found with id: " + userId);        
        }
        userRepository.deleteById(userId);
    }


    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional
    public void updateUsername(Long userId, String currentPassword, String newUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Incorrect current password.");
        }

        user.setUsername(newUsername);
        userRepository.save(user);
    }

    @Transactional
    public void updatePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Incorrect current password.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
