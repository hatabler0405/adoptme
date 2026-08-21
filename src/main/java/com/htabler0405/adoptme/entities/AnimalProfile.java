package com.htabler0405.adoptme.entities;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "animal_profiles", indexes = {
    @Index(name = "idx_animal_source_url", columnList = "sourceUrl", unique = true),
    @Index(name = "idx_animal_shelter_status", columnList = "shelter_id, status")
})
public class AnimalProfile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shelter_id", nullable = false)
    private Shelter shelter;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String sourceUrl;

    @Column(nullable = false)
    private String gender;
    private String breed;
    private String species;
    private String age;
    private String weight;
    private String size;
    private String color;

    @Column(columnDefinition = "TEXT", length = 3000)
    private String description;

    @Column(nullable = false)
    private String status = "AVAILABLE";

    private LocalDateTime lastSeenAt;
    private LocalDateTime statusChangedAt;

    @Column(columnDefinition = "TEXT")
    private String imageUrl;
    
    private Boolean hypoallergenic;
}