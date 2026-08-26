package com.htabler0405.adoptme.controllers;

import com.htabler0405.adoptme.services.RescueGroupsSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/admin/ingest")
public class AdminIngestionController {

    private final RescueGroupsSyncService rescueGroupsSyncService;

    public AdminIngestionController(
            RescueGroupsSyncService rescueGroupsSyncService) {
        this.rescueGroupsSyncService = rescueGroupsSyncService;
            }
    /**
     * Synchronizes live animal and organization data from the RescueGroups v5 API.
     */
    @PostMapping("/rescuegroups/sync")
    public ResponseEntity<Map<String, Object>> triggerRescueGroupsSync(
            @RequestParam(defaultValue = "25405") String zipCode,
            @RequestParam(defaultValue = "50") int radiusMiles) {

        int syncedCount = rescueGroupsSyncService.syncAnimalsNearZip(zipCode, radiusMiles);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "RescueGroups sync completed successfully",
                "zipCode", zipCode,
                "radiusMiles", radiusMiles,
                "animalsSynced", syncedCount
        ));
    }
}