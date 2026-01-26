package com.terrarosa.terra_crm.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for system-wide statistics (Super Admin Dashboard).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemStatsResponse {
    
    private Long totalTenants;
    private Long activeTenants;
    private Long suspendedTenants;
    private Long totalUsers;
    private Long totalAuditLogs;
    private Long schemaPoolReady;
    private Long schemaPoolAssigned;
    private Long schemaPoolError;
    private LocalDateTime lastTenantCreated;
    private LocalDateTime lastAuditLog;
}
