package com.terrarosa.terra_crm.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for suspending a tenant.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuspendTenantRequest {
    
    @NotBlank(message = "Reason is required")
    private String reason;
}
