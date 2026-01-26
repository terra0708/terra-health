package com.terrarosa.terra_crm.core.tenancy.dto;

import java.time.LocalDateTime;

/**
 * Response DTO for Schema Pool statistics.
 * Provides comprehensive information about the schema pool status for Super Admin dashboard.
 */
public record SchemaPoolStatsResponse(
    Long readyCount,
    Long assignedCount,
    Long errorCount,
    Long totalCount,
    Long minReadyCount,
    LocalDateTime lastProvisioningTime
) {
}
