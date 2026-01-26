package com.terrarosa.terra_crm.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Tenant information DTO for discovery response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantInfo {
    
    private UUID tenantId;
    private String tenantName;
    private String schemaName;
}
