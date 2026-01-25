package com.terrarosa.terra_crm.modules.auth.entity;

import com.terrarosa.terra_crm.core.tenancy.entity.Tenant;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

/**
 * Composite key class for TenantModule entity.
 * 
 * CRITICAL: Field names must match the entity's @Id field names exactly.
 * Hibernate 7 uses these field names to map the composite key.
 */
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class TenantModuleId implements Serializable {
    
    // Field names must match TenantModule entity's @Id field names
    private UUID tenant;  // Maps to TenantModule.tenant.id
    private UUID permission;  // Maps to TenantModule.permission.id
}
