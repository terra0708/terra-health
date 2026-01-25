package com.terrarosa.terra_crm.core.common.repository;

import com.terrarosa.terra_crm.core.common.entity.BaseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.NoRepositoryBean;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface that extends JpaRepository with soft delete functionality.
 * All repositories should extend this interface to get soft delete capabilities.
 * 
 * Note: Unique field suffixing (e.g., email) should be handled in service layer
 * before calling soft delete methods.
 */
@NoRepositoryBean
public interface SoftDeleteRepository<T extends BaseEntity, ID extends UUID> extends JpaRepository<T, ID> {
    
    /**
     * Soft delete an entity by setting deleted = true and deletedAt = now().
     */
    @Modifying
    @Query("UPDATE #{#entityName} e SET e.deleted = true, e.deletedAt = :deletedAt WHERE e.id = :id")
    void softDeleteById(@Param("id") ID id, @Param("deletedAt") LocalDateTime deletedAt);
    
    /**
     * Soft delete an entity.
     */
    default void softDelete(T entity) {
        entity.setDeleted(true);
        entity.setDeletedAt(LocalDateTime.now());
        save(entity);
    }
    
    /**
     * Hard delete an entity (permanently remove from database).
     * Use with caution - this bypasses soft delete.
     */
    @Modifying
    @Query("DELETE FROM #{#entityName} e WHERE e.id = :id")
    void hardDeleteById(@Param("id") ID id);
    
    /**
     * Find all entities including deleted ones.
     * CRITICAL: Access control must be enforced in service layer - only ROLE_ADMIN can access.
     */
    @Query("SELECT e FROM #{#entityName} e")
    List<T> findAllIncludingDeleted();
    
    /**
     * Find entity by ID including deleted ones.
     * CRITICAL: Access control must be enforced in service layer - only ROLE_ADMIN can access.
     */
    @Query("SELECT e FROM #{#entityName} e WHERE e.id = :id")
    Optional<T> findByIdIncludingDeleted(@Param("id") ID id);
    
    /**
     * Restore a soft-deleted entity.
     */
    @Modifying
    @Query("UPDATE #{#entityName} e SET e.deleted = false, e.deletedAt = NULL WHERE e.id = :id")
    void restoreById(@Param("id") ID id);
    
    /**
     * Override default delete methods to use soft delete.
     * Note: For entities with unique fields, use service layer methods that handle suffixing.
     */
    @Override
    default void delete(T entity) {
        softDelete(entity);
    }
    
    @Override
    default void deleteById(ID id) {
        softDeleteById(id, LocalDateTime.now());
    }
}
