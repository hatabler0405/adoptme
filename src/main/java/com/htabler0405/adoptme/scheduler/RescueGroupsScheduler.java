package com.htabler0405.adoptme.scheduler;

import com.htabler0405.adoptme.services.RescueGroupsSyncService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class RescueGroupsScheduler {

    private final RescueGroupsSyncService syncService;

    private static final String DEFAULT_ZIP = "25405";
    private static final int DEFAULT_RADIUS_MILES = 100;

    public RescueGroupsScheduler(RescueGroupsSyncService syncService) {
        this.syncService = syncService;
    }

    /**
     * Runs quickly on server startup in a background thread (fetches just page 1 so app boots instantly).
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        log.info("Triggering quick startup pet sync (Page 1)...");
        new Thread(() -> {
            try {
                // Quick sync for immediate local data on boot
                syncService.syncAnimalsNearZip(DEFAULT_ZIP, DEFAULT_RADIUS_MILES);
            } catch (Exception e) {
                log.error("Startup sync failed: {}", e.getMessage());
            }
        }).start();
    }

    /**
     * Runs every 24 hours at 3:00 AM, doing the full deep multi-page ingestion.
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void runDailyPetSync() {
        log.info("Starting scheduled 24-hour deep sync from RescueGroups API...");
        try {
            int savedCount = syncService.syncAnimalsNearZip(DEFAULT_ZIP, DEFAULT_RADIUS_MILES);
            log.info("Daily deep sync finished: Ingested/updated {} records.", savedCount);
        } catch (Exception e) {
            log.error("Scheduled pet sync encountered an error: {}", e.getMessage(), e);
        }
    }
}