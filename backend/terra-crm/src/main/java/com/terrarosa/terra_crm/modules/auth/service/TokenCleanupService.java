package com.terrarosa.terra_crm.modules.auth.service;

import com.terrarosa.terra_crm.modules.auth.repository.RefreshTokenRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Service for cleaning up expired and revoked refresh tokens.
 * Runs scheduled cleanup job every night at 02:00 to free up disk space.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TokenCleanupService {
    
    private final RefreshTokenRepository refreshTokenRepository;
    
    /**
     * Cleanup expired and revoked refresh tokens.
     * Runs every night at 02:00:00.
     * Performs hard delete to free up disk space.
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupExpiredAndRevokedTokens() {
        try {
            log.info("Starting refresh token cleanup job...");
            LocalDateTime now = LocalDateTime.now();
            
            int deletedCount = refreshTokenRepository.deleteExpiredOrRevokedTokens(now);
            
            log.info("{} adet eski refresh token veritabanından temizlendi.", deletedCount);
        } catch (Exception e) {
            log.error("Error during refresh token cleanup: {}", e.getMessage(), e);
            // Don't rethrow - scheduled tasks should not crash the application
        }
    }
}
