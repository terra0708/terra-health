package com.terrarosa.terra_crm.core.tenancy;


import org.springframework.stereotype.Component;

/**
 * Hibernate resolver for determining the current tenant identifier.
 * This is used by Hibernate to know which schema to use for queries.
 */
@Component
public class CurrentTenantIdentifierResolver implements org.hibernate.context.spi.CurrentTenantIdentifierResolver<String> {
    
    @Override
    public String resolveCurrentTenantIdentifier() {
        String schemaName = TenantContext.getCurrentSchemaName();
        // Return "public" as default if no tenant is set (for public schema operations)
        return schemaName != null ? schemaName : "public";
    }
    
    @Override
    public boolean validateExistingCurrentSessions() {
        return true;
    }
}
