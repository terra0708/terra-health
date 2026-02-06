package com.terrarosa.terra_crm.modules.health.repository;

import com.terrarosa.terra_crm.modules.health.entity.CustomerFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerFileRepository extends JpaRepository<CustomerFile, UUID> {

    /**
     * Find all files for a customer (excluding deleted)
     */
    List<CustomerFile> findByCustomerIdAndIsDeletedFalseOrderByCreatedAtDesc(UUID customerId);

    /**
     * Find all files for a customer (including deleted)
     */
    List<CustomerFile> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);

    /**
     * Find file by ID and customer ID (not deleted)
     */
    Optional<CustomerFile> findByIdAndCustomerIdAndIsDeletedFalse(UUID id, UUID customerId);

    /**
     * Find all deleted files (trash)
     */
    List<CustomerFile> findByIsDeletedTrueOrderByDeletedAtDesc();

    /**
     * Find old deleted files for auto-cleanup
     */
    List<CustomerFile> findByIsDeletedTrueAndDeletedAtBefore(LocalDateTime cutoffDate);

    /**
     * Count files in a category (excluding deleted)
     */
    @Query("SELECT COUNT(cf) FROM CustomerFile cf WHERE cf.category.id = :categoryId AND cf.isDeleted = false")
    Long countByCategoryId(@Param("categoryId") UUID categoryId);

    /**
     * Find files by category (for migration)
     */
    List<CustomerFile> findByCategoryIdAndIsDeletedFalse(UUID categoryId);
}
