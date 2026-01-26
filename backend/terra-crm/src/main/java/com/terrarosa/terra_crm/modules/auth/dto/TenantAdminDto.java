package com.terrarosa.terra_crm.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTO for tenant admin user information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantAdminDto {
    
    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private UUID tenantId;
    private List<String> roles;
}
