package com.terrarosa.terra_crm.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for tenant information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantDto {
    
    private UUID id;
    private String name;
    private String schemaName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
