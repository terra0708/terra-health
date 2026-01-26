package com.terrarosa.terra_crm.core.tenancy.entity;

/**
 * Status enum for Tenant entities.
 */
public enum TenantStatus {
    /**
     * Tenant is active and can accept requests.
     */
    ACTIVE,
    
    /**
     * Tenant is suspended and cannot accept requests.
     * All requests from this tenant should be rejected at interceptor level.
     */
    SUSPENDED,
    
    /**
     * Tenant is deleted (soft delete).
     * This status is typically set when tenant is soft-deleted.
     */
    DELETED
}
