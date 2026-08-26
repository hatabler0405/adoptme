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
     * Runs quickly on server startup in a background thread so the app boots instantly
     * and seeds local Quad-State / WV / MD / VA data right away.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        log.info("Triggering quick startup pet sync for ZIP {} ({} mi)...", DEFAULT_ZIP, DEFAULT_RADIUS_MILES);
        new Thread(() -> {
            try {
                int saved = syncService.syncAnimalsNearZip(DEFAULT_ZIP, DEFAULT_RADIUS_MILES);
                log.info("Startup pet sync complete. Seeded {} local records.", saved);
            } catch (Exception e) {
                log.error("Startup sync failed: {}", e.getMessage());
            }
        }).start();
    }

    /**
     * Daily local refresh: Runs every day at 3:00 AM server time for your primary 100-mile radius.
     */
    @Scheduled(cron = "0 0 3 * * ?")
    public void runDailyLocalSync() {
        log.info("Starting daily local pet sync for {} ({} mi)...", DEFAULT_ZIP, DEFAULT_RADIUS_MILES);
        try {
            int savedCount = syncService.syncAnimalsNearZip(DEFAULT_ZIP, DEFAULT_RADIUS_MILES);
            log.info("Daily local sync complete: Ingested/updated {} records.", savedCount);
        } catch (Exception e) {
            log.error("Daily local pet sync failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Weekly nationwide bulk ingestion: Runs every Sunday at 4:00 AM server time across all 8 national hubs.
     * Executes non-blocking in the background via @Async.
     */
    @Scheduled(cron = "0 0 4 * * SUN")
    public void runWeeklyNationwideSync() {
        log.info("Starting scheduled weekly nationwide bulk ingestion...");
        try {
            syncService.syncNationwideDatabase();
        } catch (Exception e) {
            log.error("Weekly nationwide sync failed: {}", e.getMessage(), e);
        }
    }
}