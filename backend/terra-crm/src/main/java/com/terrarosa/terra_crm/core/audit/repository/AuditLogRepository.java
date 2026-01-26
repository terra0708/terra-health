package com.terrarosa.terra_crm.core.audit.repository;

import com.terrarosa.terra_crm.core.audit.entity.AuditLog;
import com.terrarosa.terra_crm.core.common.repository.SoftDeleteRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository for AuditLog entity.
 * Provides methods for querying audit logs with various filters.
 */
@Repository
public interface AuditLogRepository extends SoftDeleteRepository<AuditLog, UUID> {
    
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
