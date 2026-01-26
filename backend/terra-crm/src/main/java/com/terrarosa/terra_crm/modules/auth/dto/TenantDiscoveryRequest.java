package com.terrarosa.terra_crm.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for tenant discovery by email.
 * Used to find which tenant(s) a user belongs to before login.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantDiscoveryRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;
}
