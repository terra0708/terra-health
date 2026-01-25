package com.terrarosa.terra_crm.modules.auth.entity;

import com.terrarosa.terra_crm.core.common.entity.BaseEntity;
import com.terrarosa.terra_crm.core.tenancy.entity.Tenant;
import jakarta.persistence.*;
import lombok.*;

import java.util.Objects;

/**
 * Entity representing the relationship between tenants and modules (permissions).
 * 
 * CRITICAL: Uses simple UUID ID instead of @IdClass to avoid Hibernate 7 TableGroup.getModelPart() errors.
 * Unique constraint ensures data integrity (one tenant can have one instance of each module).
 */
@Entity
@Table(name = "tenant_modules", schema = "public",
       uniqueConstraints = @UniqueConstraint(name = "uk_tenant_modules_tenant_permission", 
                                             columnNames = {"tenant_id", "permission_id"}))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
@ToString(exclude = {"tenant", "permission"})
public class TenantModule extends BaseEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "permission_id", nullable = false)
    private Permission permission;
    
    // Manual equals and hashCode - only based on id to avoid circular references
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TenantModule that = (TenantModule) o;
        return Objects.equals(getId(), that.getId());
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(getId());
    }
}
