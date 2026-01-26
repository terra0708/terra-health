package com.terrarosa.terra_crm.core.tenancy.repository;

import com.terrarosa.terra_crm.core.common.repository.SoftDeleteRepository;
import com.terrarosa.terra_crm.core.tenancy.entity.SchemaPool;
import com.terrarosa.terra_crm.core.tenancy.entity.SchemaPoolStatus;
import org.springframework.data.jpa.repository.Query;
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
     * Uses pessimistic write lock via FOR UPDATE to prevent concurrent access.
     * 
     * CRITICAL: This method locks the row until transaction commits.
     * Only one transaction can acquire this lock at a time.
     * 
     * CRITICAL: Native queries cannot use @Lock annotation (Hibernate limitation).
     * Instead, we use FOR UPDATE in SQL which provides pessimistic locking.
     * 
     * CRITICAL: JPQL query with explicit LIMIT using setMaxResults is not possible in repository interface.
     * Using native query with LIMIT 1 to ensure only one result is returned.
     * When using @Query, Spring Data JPA's "findFirst" semantics don't apply,
     * so we must explicitly add LIMIT 1 in the SQL.
     * 
     * CRITICAL: In native queries, Hibernate sends enum as SMALLINT (ordinal) by default, not as string.
     * Since the database column is VARCHAR, we must accept String parameter and compare directly.
     * The service layer should pass status.name() (e.g., "READY") to this method.
     */
    @Query(value = "SELECT * FROM schema_pool sp WHERE sp.status = :status AND COALESCE(sp.deleted, false) = false ORDER BY sp.created_at ASC LIMIT 1 FOR UPDATE", nativeQuery = true)
    Optional<SchemaPool> findOldestReadySchema(@Param("status") String status);
    
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
