package com.terrarosa.terra_crm.modules.auth.entity;

import com.terrarosa.terra_crm.core.tenancy.entity.Tenant;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

/**
 * Composite key class for TenantModule entity.
 */
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class TenantModuleId implements Serializable {
    
    private UUID tenant;
    private UUID permission;
}
