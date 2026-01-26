package com.terrarosa.terra_crm.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for toggling a module (feature flag) for a tenant.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToggleModuleRequest {
    
    @NotBlank(message = "Module name is required")
    private String moduleName;
    
    @NotNull(message = "Enabled flag is required")
    private Boolean enabled;
}
