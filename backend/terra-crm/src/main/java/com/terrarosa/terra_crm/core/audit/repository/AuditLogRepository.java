package com.terrarosa.terra_crm.core.audit.repository;

import com.terrarosa.terra_crm.core.audit.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for AuditLog entity.
 * Append-only: audit logs are never deleted or updated (immutable for compliance).
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    
    /**
     * Find audit logs by tenant ID.
     */
    @Query("SELECT al FROM AuditLog al WHERE al.tenantId = :tenantId ORDER BY al.createdAt DESC")
    List<AuditLog> findByTenantId(@Param("tenantId") UUID tenantId);
    
    /**
     * Find audit logs by user ID.
     */
    @Query("SELECT al FROM AuditLog al WHERE al.userId = :userId ORDER BY al.createdAt DESC")
    List<AuditLog> findByUserId(@Param("userId") UUID userId);
    
    /**
     * Find audit logs by action.
     */
    @Query("SELECT al FROM AuditLog al WHERE al.action = :action ORDER BY al.createdAt DESC")
    List<AuditLog> findByAction(@Param("action") String action);
    
    /**
     * Find audit logs by resource type and resource ID.
     */
    @Query("SELECT al FROM AuditLog al WHERE al.resourceType = :resourceType AND al.resourceId = :resourceId ORDER BY al.createdAt DESC")
    List<AuditLog> findByResource(@Param("resourceType") String resourceType, @Param("resourceId") UUID resourceId);
}
