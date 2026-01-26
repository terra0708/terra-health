package com.terrarosa.terra_crm.core.maintenance.repository;

import com.terrarosa.terra_crm.core.maintenance.entity.MaintenanceMode;
import com.terrarosa.terra_crm.core.common.repository.SoftDeleteRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for MaintenanceMode entity.
 */
@Repository
public interface MaintenanceModeRepository extends SoftDeleteRepository<MaintenanceMode, UUID> {
    
    /**
     * Find global maintenance mode (tenantId is null).
     */
    @Query("SELECT mm FROM MaintenanceMode mm WHERE mm.tenantId IS NULL")
    Optional<MaintenanceMode> findGlobalMaintenanceMode();
    
    /**
     * Find tenant-specific maintenance mode.
     */
    @Query("SELECT mm FROM MaintenanceMode mm WHERE mm.tenantId = :tenantId")
    Optional<MaintenanceMode> findByTenantId(@Param("tenantId") UUID tenantId);
    
    /**
     * Check if global maintenance mode is active.
     */
    @Query("SELECT COUNT(mm) > 0 FROM MaintenanceMode mm WHERE mm.tenantId IS NULL AND mm.active = true")
    boolean isGlobalMaintenanceActive();
    
    /**
     * Check if tenant-specific maintenance mode is active.
     */
    @Query("SELECT COUNT(mm) > 0 FROM MaintenanceMode mm WHERE mm.tenantId = :tenantId AND mm.active = true")
    boolean isTenantMaintenanceActive(@Param("tenantId") UUID tenantId);
}
