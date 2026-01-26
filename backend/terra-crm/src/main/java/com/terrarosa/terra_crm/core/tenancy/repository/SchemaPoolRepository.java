package com.terrarosa.terra_crm.core.tenancy.repository;

import com.terrarosa.terra_crm.core.common.repository.SoftDeleteRepository;
import com.terrarosa.terra_crm.core.tenancy.entity.SchemaPool;
import com.terrarosa.terra_crm.core.tenancy.entity.SchemaPoolStatus;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for SchemaPool entity.
 * Provides methods for managing pre-provisioned tenant schemas.
 */
@Repository
public interface SchemaPoolRepository extends SoftDeleteRepository<SchemaPool, UUID> {
    
    /**
     * Count READY schemas in the pool (excluding deleted).
     */
    @Query("SELECT COUNT(sp) FROM SchemaPool sp WHERE sp.status = :status AND sp.deleted = false")
    long countByStatus(@Param("status") SchemaPoolStatus status);
    
    /**
     * Find the oldest READY schema (FIFO - First In First Out).
     * Uses pessimistic write lock to prevent concurrent access.
     * Timeout set to 2 seconds to prevent deadlocks.
     * 
     * CRITICAL: This method locks the row until transaction commits.
     * Only one transaction can acquire this lock at a time.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints({
        @QueryHint(name = "jakarta.persistence.lock.timeout", value = "2000")
    })
    @Query("SELECT sp FROM SchemaPool sp WHERE sp.status = :status AND sp.deleted = false ORDER BY sp.createdAt ASC")
    Optional<SchemaPool> findOldestReadySchema(@Param("status") SchemaPoolStatus status);
    
    /**
     * Find schema by schema name (excluding deleted).
     */
    @Query("SELECT sp FROM SchemaPool sp WHERE sp.schemaName = :schemaName AND sp.deleted = false")
    Optional<SchemaPool> findBySchemaName(@Param("schemaName") String schemaName);
    
    /**
     * Check if a schema name exists in the pool (excluding deleted).
     * Used for unique validation during schema name generation.
     */
    @Query("SELECT COUNT(sp) > 0 FROM SchemaPool sp WHERE sp.schemaName = :schemaName AND sp.deleted = false")
    boolean existsBySchemaName(@Param("schemaName") String schemaName);
    
    /**
     * Count schemas grouped by status (excluding deleted).
     * Returns a list of Object arrays where each array contains [status, count].
     * 
     * CRITICAL: This method uses a single GROUP BY query to fetch all status counts
     * in one database round trip, minimizing I/O overhead.
     * 
     * Note: If a status has no records, PostgreSQL will not return a row for that status.
     * The service layer must handle this using EnumMap with default values.
     * 
     * @return List of Object arrays, each containing [SchemaPoolStatus, Long count]
     */
    @Query("SELECT sp.status, COUNT(sp) FROM SchemaPool sp WHERE sp.deleted = false GROUP BY sp.status")
    List<Object[]> countByStatusGrouped();
    
    /**
     * Find the most recently created schema with the specified status (excluding deleted).
     * Used to get the last provisioning time for READY schemas.
     * 
     * CRITICAL: Using Spring Data JPA method name parsing instead of @Query.
     * The "findFirst" prefix automatically adds LIMIT 1.
     * Soft delete filtering is handled by @SQLRestriction on BaseEntity.
     * 
     * @param status The status to filter by
     * @return Optional containing the most recently created schema, or empty if none exists
     */
    Optional<SchemaPool> findFirstByStatusAndDeletedFalseOrderByCreatedAtDesc(SchemaPoolStatus status);
}
