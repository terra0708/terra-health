package com.terrarosa.terra_crm.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for maintenance mode response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceModeResponse {
    
    private UUID id;
    private UUID tenantId;
    private Boolean active;
    private String message;
    private LocalDateTime scheduledStart;
    private LocalDateTime scheduledEnd;
    private Boolean isGlobal;
    private Boolean isCurrentlyActive;
}
