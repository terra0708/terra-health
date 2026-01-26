package com.terrarosa.terra_crm.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for creating a new tenant with admin user and modules.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTenantRequest {
    
    @NotBlank(message = "Tenant name is required")
    @Size(min = 2, max = 255, message = "Tenant name must be between 2 and 255 characters")
    private String tenantName;
    
    @NotBlank(message = "Admin first name is required")
    @Size(min = 1, max = 255, message = "Admin first name must be between 1 and 255 characters")
    private String adminFirstName;
    
    @NotBlank(message = "Admin last name is required")
    @Size(min = 1, max = 255, message = "Admin last name must be between 1 and 255 characters")
    private String adminLastName;
    
    @NotBlank(message = "Admin email is required")
    @Email(message = "Admin email must be valid")
    private String adminEmail;
    
    @NotBlank(message = "Admin password is required")
    @Size(min = 8, message = "Admin password must be at least 8 characters")
    private String adminPassword;
    
    @NotEmpty(message = "At least one module must be selected")
    private List<@NotBlank(message = "Module name cannot be blank") String> moduleNames;
}
