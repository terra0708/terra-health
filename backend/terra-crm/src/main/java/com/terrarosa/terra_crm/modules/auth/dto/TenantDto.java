package com.terrarosa.terra_crm.modules.auth.dto;

import com.terrarosa.terra_crm.core.tenancy.entity.TenantStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
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
    private TenantStatus status;
    private Map<String, Object> quotaLimits;
    private List<String> assignedModules;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
