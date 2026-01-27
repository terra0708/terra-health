package com.terrarosa.terra_crm.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for setting modules for a tenant.
 * Replaces all existing modules with the provided list.
 * 
 * NOTE: Empty list is allowed - this will remove all modules from the tenant.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetTenantModulesRequest {
    
    private List<String> moduleNames;
}
