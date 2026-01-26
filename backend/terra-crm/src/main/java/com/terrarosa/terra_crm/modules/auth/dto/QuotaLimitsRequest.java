package com.terrarosa.terra_crm.modules.auth.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * DTO for setting quota limits for a tenant.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuotaLimitsRequest {
    
    @NotNull(message = "Quotas map is required")
    private Map<String, Object> quotas;
}
