package com.htabler0405.adoptme.entities;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.locationtech.jts.geom.Point;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.htabler0405.adoptme.sources.SourceType;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id; 
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "shelters")
@Getter
@Setter
@NoArgsConstructor
public class Shelter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rescuegroups_org_id", unique = true)
    private Long rescuegroupsOrgId;

    @Column(nullable = false)
    private String name;

    @Column(name = "default_adoption_fee")
    private BigDecimal defaultAdoptionFee;

    @Enumerated(EnumType.STRING)
    private SourceType sourcetype;

    private String email;
    private String phoneNumber;
    private String address;
    private String zipCode;
    private String websiteUrl;
    private String adoptionListingsUrl;

    @JsonIgnore
    @Column(columnDefinition = "geometry(Point, 4326)")
    private Point location;

    @JsonManagedReference
    @OneToMany(mappedBy = "shelter", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AnimalProfile> animals = new ArrayList<>();

    @JsonProperty("latitude")
    public Double getLatitude() {
        return location != null ? location.getY() : null;
    }

    @JsonProperty("longitude")
    public Double getLongitude() {
        return location != null ? location.getX() : null;
    }
}