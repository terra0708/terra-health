package com.terrarosa.terra_crm.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for enabling maintenance mode.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceModeRequest {
    
    private String message;
    private LocalDateTime scheduledStart;
    private LocalDateTime scheduledEnd;
}
