package com.terrarosa.terra_crm.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for tenant discovery.
 * 
 * If user belongs to single tenant: returns single TenantInfo object.
 * If user belongs to multiple tenants: returns list of TenantInfo objects.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantDiscoveryResponse {
    
    /**
     * List of tenants associated with the email.
     * Single tenant: list with one element.
     * Multiple tenants: list with multiple elements.
     * No tenant found: empty list (but response still returns success to prevent user enumeration).
     */
    private List<TenantInfo> tenants;
    
    /**
     * Convenience method to check if single tenant.
     */
    public boolean isSingleTenant() {
        return tenants != null && tenants.size() == 1;
    }
    
    /**
     * Convenience method to get single tenant (if exists).
     */
    public TenantInfo getSingleTenant() {
        return isSingleTenant() ? tenants.get(0) : null;
    }
}
