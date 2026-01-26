package com.terrarosa.terra_crm.core.maintenance.entity;

import com.terrarosa.terra_crm.core.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity for managing maintenance mode (global or tenant-specific).
 * When maintenance mode is active, all requests (except Super Admin) are blocked.
 */
@Entity
@Table(name = "maintenance_mode", schema = "public")
@Getter
@Setter
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceMode extends BaseEntity {
    
    /**
     * Tenant ID for tenant-specific maintenance mode.
     * If null, this is a global maintenance mode.
     */
    @Column(name = "tenant_id")
    private UUID tenantId;
    
    /**
     * Whether maintenance mode is currently active.
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean active = false;
    
    /**
     * Maintenance message to display to users.
     */
    @Column(name = "message", columnDefinition = "TEXT")
    private String message;
    
    /**
     * Scheduled start time for maintenance (optional).
     */
    @Column(name = "scheduled_start")
    private LocalDateTime scheduledStart;
    
    /**
     * Scheduled end time for maintenance (optional).
     */
    @Column(name = "scheduled_end")
    private LocalDateTime scheduledEnd;
    
    /**
     * Check if this is a global maintenance mode.
     */
    public boolean isGlobal() {
        return tenantId == null;
    }
    
    /**
     * Check if maintenance is currently active (considering scheduled times).
     */
    public boolean isCurrentlyActive() {
        if (!active) {
            return false;
        }
        
        LocalDateTime now = LocalDateTime.now();
        
        // Check scheduled start time
        if (scheduledStart != null && now.isBefore(scheduledStart)) {
            return false;
        }
        
        // Check scheduled end time
        if (scheduledEnd != null && now.isAfter(scheduledEnd)) {
            return false;
        }
        
        return true;
    }
}
