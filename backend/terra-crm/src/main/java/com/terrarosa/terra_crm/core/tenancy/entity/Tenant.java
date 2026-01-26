package com.terrarosa.terra_crm.core.tenancy.entity;

import com.terrarosa.terra_crm.core.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "tenants", schema = "public")
@Getter
@Setter
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tenant extends BaseEntity {
    
    @Column(nullable = false)
    private String name;
    
    @Column(name = "schema_name", nullable = false, unique = true)
    private String schemaName;
    
    /**
     * Status of the tenant (ACTIVE, SUSPENDED, DELETED).
     * SUSPENDED tenants cannot accept requests (rejected at interceptor level).
     * 
     * CRITICAL: Using @JdbcTypeCode for PostgreSQL enum type support.
     * The database column is of type tenant_status (PostgreSQL enum), not VARCHAR.
     * @Enumerated(EnumType.STRING) would send VARCHAR, causing type mismatch.
     */
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "tenant_status")
    @Builder.Default
    private TenantStatus status = TenantStatus.ACTIVE;
    
    /**
     * Resource quota limits for this tenant (JSONB).
     * Example: {"customers": 1000, "appointments": 5000, "storage_mb": 1024}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "quota_limits", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> quotaLimits = Map.of();
    
    /**
     * Check if tenant is active.
     */
    public boolean isActive() {
        return status == TenantStatus.ACTIVE;
    }
    
    /**
     * Check if tenant is suspended.
     */
    public boolean isSuspended() {
        return status == TenantStatus.SUSPENDED;
    }
    
    /**
     * Check if tenant can accept requests.
     * Only ACTIVE tenants and SYSTEM tenant (null tenantId) can accept requests.
     */
    public boolean canAcceptRequests() {
        // SYSTEM tenant (no tenantId) is always allowed
        if (this.getId() == null) {
            return true;
        }
        return status == TenantStatus.ACTIVE;
    }
}
