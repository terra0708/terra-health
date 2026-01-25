package com.terrarosa.terra_crm.core.tenancy;

import lombok.Getter;
import lombok.Setter;

/**
 * ThreadLocal-based context for storing current tenant information.
 * This ensures that each request thread has its own tenant context.
 */
public class TenantContext {
    
    private static final ThreadLocal<TenantInfo> CONTEXT = new ThreadLocal<>();
    
    @Getter
    @Setter
    public static class TenantInfo {
        private String tenantId;
        private String schemaName;
        
        public TenantInfo(String tenantId, String schemaName) {
            this.tenantId = tenantId;
            this.schemaName = schemaName;
        }
    }
    
    /**
     * Set the current tenant information for this thread.
     */
    public static void setCurrentTenant(String tenantId, String schemaName) {
        CONTEXT.set(new TenantInfo(tenantId, schemaName));
    }
    
    /**
     * Get the current tenant information for this thread.
     */
    public static TenantInfo getCurrentTenant() {
        return CONTEXT.get();
    }
    
    /**
     * Get the current tenant ID.
     */
    public static String getCurrentTenantId() {
        TenantInfo info = CONTEXT.get();
        return info != null ? info.getTenantId() : null;
    }
    
    /**
     * Get the current schema name.
     */
    public static String getCurrentSchemaName() {
        TenantInfo info = CONTEXT.get();
        return info != null ? info.getSchemaName() : null;
    }
    
    /**
     * Clear the tenant context for this thread.
     * Should be called after request processing to prevent memory leaks.
     */
    public static void clear() {
        CONTEXT.remove();
    }
}
