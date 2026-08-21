package com.htabler0405.adoptme.controllers;

import org.springframework.web.bind.annotation.RestController;

import com.htabler0405.adoptme.services.AnimalQueryService;
import com.htabler0405.adoptme.dto.AnimalFilterRequest;
import com.htabler0405.adoptme.dto.AnimalResponseDto;
import com.htabler0405.adoptme.entities.AnimalProfile;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;


@RestController
@RequestMapping("/api/animals")
@CrossOrigin(origins = "http://localhost:5173")
public class AnimalController {

    private final AnimalQueryService animalQueryService;

    public AnimalController(AnimalQueryService animalQueryService) {
        this.animalQueryService = animalQueryService;
    }

    @PostMapping("/search")
    public ResponseEntity<Page<AnimalResponseDto>> searchAnimals(@RequestBody AnimalFilterRequest filterRequest,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "16") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {
                
        Sort sort = direction.equalsIgnoreCase("desc") 
                ? Sort.by(sortBy).descending() 
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<AnimalProfile> matchedAnimals = animalQueryService.filterAnimals(filterRequest, pageable);
        
        Page<AnimalResponseDto> results = matchedAnimals.map(AnimalResponseDto::new);

        return ResponseEntity.ok(results);
    }
    
    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<AnimalResponseDto> getAnimalById(@PathVariable Long id) {
        return animalQueryService.findAnimalById(id)
                .map(animal -> ResponseEntity.ok(new AnimalResponseDto(animal)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    
}
