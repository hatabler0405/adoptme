package com.htabler0405.adoptme.controllers;

import com.htabler0405.adoptme.dto.AnimalResponseDto;
import com.htabler0405.adoptme.dto.CreateUserRequest;
import com.htabler0405.adoptme.dto.UpdatePasswordRequest;
import com.htabler0405.adoptme.dto.UpdateUsernameRequest;
import com.htabler0405.adoptme.services.FavoriteAnimalService;
import com.htabler0405.adoptme.services.UserAccountOptionsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserAccountOptionsService accountOptionsService;
    private final FavoriteAnimalService favoriteService;

    public UserController(UserAccountOptionsService accountOptionsService, FavoriteAnimalService favoriteService) {
        this.accountOptionsService = accountOptionsService;
        this.favoriteService = favoriteService;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createUser(@RequestBody CreateUserRequest request) {
        accountOptionsService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body("User registered successfully");
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteUser(Principal principal) {
        Long userId = Long.parseLong(principal.getName());
        accountOptionsService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/update/username")
    public ResponseEntity<Void> updateUsername(
            Principal principal,
            @RequestBody UpdateUsernameRequest request) {

        Long userId = Long.parseLong(principal.getName());

        accountOptionsService.updateUsername(
            userId, 
            request.getCurrentPassword(), 
            request.getNewUsername()
        );
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/update/password")
    public ResponseEntity<Void> updatePassword(
            Principal principal,
            @RequestBody UpdatePasswordRequest request) {

        Long userId = Long.parseLong(principal.getName());

        accountOptionsService.updatePassword(
            userId, 
            request.getCurrentPassword(), 
            request.getNewPassword()
        );
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/favorites/{animalId}")
    public ResponseEntity<Void> addFavorite(
            Principal principal, 
            @PathVariable Long animalId) {
        
        Long userId = Long.parseLong(principal.getName());
        favoriteService.addFavoriteAnimal(userId, animalId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/favorites/{animalId}")
    public ResponseEntity<Void> removeFavorite(
            Principal principal, 
            @PathVariable Long animalId) {
        
        Long userId = Long.parseLong(principal.getName());
        favoriteService.removeFavoriteAnimal(userId, animalId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/favorites")
    public ResponseEntity<List<AnimalResponseDto>> getUserFavorites(Principal principal) {
        Long userId = Long.parseLong(principal.getName());
        List<AnimalResponseDto> favorites = favoriteService.getUserFavoriteAnimal(userId);
        return ResponseEntity.ok(favorites);
    }
}