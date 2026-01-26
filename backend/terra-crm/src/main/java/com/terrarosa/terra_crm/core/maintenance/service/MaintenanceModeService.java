package com.terrarosa.terra_crm.core.maintenance.service;

import com.terrarosa.terra_crm.core.audit.annotation.AuditLog;
import com.terrarosa.terra_crm.core.maintenance.entity.MaintenanceMode;
import com.terrarosa.terra_crm.core.maintenance.repository.MaintenanceModeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing maintenance mode (global and tenant-specific).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MaintenanceModeService {
    
    private final MaintenanceModeRepository maintenanceModeRepository;
    
    /**
     * Check if global maintenance mode is active.
     */
    @Transactional(readOnly = true)
    public boolean isGlobalMaintenanceActive() {
        return maintenanceModeRepository.findGlobalMaintenanceMode()
                .map(MaintenanceMode::isCurrentlyActive)
                .orElse(false);
    }
    
    /**
     * Check if tenant-specific maintenance mode is active.
     */
    @Transactional(readOnly = true)
    public boolean isTenantMaintenanceActive(UUID tenantId) {
        if (tenantId == null) {
            return false;
        }
        return maintenanceModeRepository.findByTenantId(tenantId)
                .map(MaintenanceMode::isCurrentlyActive)
                .orElse(false);
    }
    
    /**
     * Check if maintenance mode is active for a tenant (checks both global and tenant-specific).
     */
    @Transactional(readOnly = true)
    public boolean isMaintenanceActive(UUID tenantId) {
        // Global maintenance mode affects all tenants
        if (isGlobalMaintenanceActive()) {
            return true;
        }
        
        // Check tenant-specific maintenance mode
        return isTenantMaintenanceActive(tenantId);
    }
    
    /**
     * Enable global maintenance mode.
     */
    @AuditLog(action = "MAINTENANCE_ENABLED", resourceType = "SYSTEM")
    @Transactional
    public MaintenanceMode enableGlobalMaintenance(String message, LocalDateTime scheduledStart, LocalDateTime scheduledEnd) {
        MaintenanceMode maintenanceMode = maintenanceModeRepository.findGlobalMaintenanceMode()
                .orElse(MaintenanceMode.builder()
                        .tenantId(null)
                        .active(false)
                        .build());
        
        maintenanceMode.setActive(true);
        maintenanceMode.setMessage(message);
        maintenanceMode.setScheduledStart(scheduledStart);
        maintenanceMode.setScheduledEnd(scheduledEnd);
        
        MaintenanceMode saved = maintenanceModeRepository.save(maintenanceMode);
        log.info("Global maintenance mode enabled");
        return saved;
    }
    
    /**
     * Disable global maintenance mode.
     */
    @AuditLog(action = "MAINTENANCE_DISABLED", resourceType = "SYSTEM")
    @Transactional
    public void disableGlobalMaintenance() {
        maintenanceModeRepository.findGlobalMaintenanceMode()
                .ifPresent(mode -> {
                    mode.setActive(false);
                    maintenanceModeRepository.save(mode);
                    log.info("Global maintenance mode disabled");
                });
    }
    
    /**
     * Enable tenant-specific maintenance mode.
     */
    @AuditLog(action = "MAINTENANCE_ENABLED", resourceType = "TENANT")
    @Transactional
    public MaintenanceMode enableTenantMaintenance(UUID tenantId, String message, LocalDateTime scheduledStart, LocalDateTime scheduledEnd) {
        MaintenanceMode maintenanceMode = maintenanceModeRepository.findByTenantId(tenantId)
                .orElse(MaintenanceMode.builder()
                        .tenantId(tenantId)
                        .active(false)
                        .build());
        
        maintenanceMode.setActive(true);
        maintenanceMode.setMessage(message);
        maintenanceMode.setScheduledStart(scheduledStart);
        maintenanceMode.setScheduledEnd(scheduledEnd);
        
        MaintenanceMode saved = maintenanceModeRepository.save(maintenanceMode);
        log.info("Tenant maintenance mode enabled for tenant: {}", tenantId);
        return saved;
    }
    
    /**
     * Disable tenant-specific maintenance mode.
     */
    @AuditLog(action = "MAINTENANCE_DISABLED", resourceType = "TENANT")
    @Transactional
    public void disableTenantMaintenance(UUID tenantId) {
        maintenanceModeRepository.findByTenantId(tenantId)
                .ifPresent(mode -> {
                    mode.setActive(false);
                    maintenanceModeRepository.save(mode);
                    log.info("Tenant maintenance mode disabled for tenant: {}", tenantId);
                });
    }
    
    /**
     * Get global maintenance mode.
     */
    @Transactional(readOnly = true)
    public Optional<MaintenanceMode> getGlobalMaintenanceMode() {
        return maintenanceModeRepository.findGlobalMaintenanceMode();
    }
    
    /**
     * Get tenant-specific maintenance mode.
     */
    @Transactional(readOnly = true)
    public Optional<MaintenanceMode> getTenantMaintenanceMode(UUID tenantId) {
        return maintenanceModeRepository.findByTenantId(tenantId);
    }
}
