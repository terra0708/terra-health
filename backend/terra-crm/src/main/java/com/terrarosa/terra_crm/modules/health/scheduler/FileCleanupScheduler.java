package com.terrarosa.terra_crm.modules.health.scheduler;

import com.terrarosa.terra_crm.modules.health.service.CustomerFileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * FileCleanupScheduler
 * 
 * Scheduled job to automatically delete files from trash older than 30 days
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FileCleanupScheduler {

    private final CustomerFileService fileService;

    /**
     * Auto-delete old trash files
     * Runs daily at 2:00 AM
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void cleanupOldTrashFiles() {
        log.info("Starting scheduled cleanup of old trash files");
        try {
            fileService.autoDeleteOldTrashFiles();
            log.info("Completed scheduled cleanup of old trash files");
        } catch (Exception e) {
            log.error("Failed to cleanup old trash files", e);
        }
    }
}
