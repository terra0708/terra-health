package com.terrarosa.terra_crm.core.audit.entity;

import com.terrarosa.terra_crm.core.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;
import java.util.UUID;

/**
 * Entity for storing audit logs of all system actions.
 * Used for comprehensive audit trail of Super Admin operations and system events.
 */
@Entity
@Table(name = "audit_logs", schema = "public")
@Getter
@Setter
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog extends BaseEntity {
    
    /**
     * User who performed the action.
     * Foreign key to users table.
     */
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    
    /**
     * Action performed (e.g., "TENANT_SUSPENDED", "SESSION_STARTED", "PASSWORD_RESET").
     */
    @Column(nullable = false, length = 100)
    private String action;
    
    /**
     * Type of resource affected (e.g., "TENANT", "USER", "MODULE").
     */
    @Column(name = "resource_type", length = 50)
    private String resourceType;
    
    /**
     * ID of the resource affected.
     */
    @Column(name = "resource_id")
    private UUID resourceId;
    
    /**
     * Tenant ID where the action was performed.
     * Null for system-wide actions.
     */
    @Column(name = "tenant_id")
    private UUID tenantId;
    
    /**
     * IP address of the client who performed the action.
     * Supports IPv6 (max 45 characters).
     */
    @Column(name = "ip_address", length = 45)
    private String ipAddress;
    
    /**
     * User agent string of the client.
     */
    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;
    
    /**
     * Additional metadata about the action (JSONB).
     * Example: {"reason": "Payment overdue", "impersonated_user_id": "..."}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> metadata = Map.of();
}
