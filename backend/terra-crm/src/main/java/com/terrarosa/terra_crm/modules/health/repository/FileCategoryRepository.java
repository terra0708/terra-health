package com.terrarosa.terra_crm.modules.health.repository;

import com.terrarosa.terra_crm.modules.health.entity.FileCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FileCategoryRepository extends JpaRepository<FileCategory, UUID> {

    Optional<FileCategory> findByLabelEn(String labelEn);

    /**
     * Find all non-deleted file categories
     */
    List<FileCategory> findByDeletedFalseOrderByCreatedAtAsc();

    /**
     * Find by ID and not deleted
     */
    Optional<FileCategory> findByIdAndDeletedFalse(UUID id);

    /**
     * Check if category is deletable
     */
    @Query("SELECT fc.isDeletable FROM FileCategory fc WHERE fc.id = :id AND fc.deleted = false")
    Optional<Boolean> isDeletable(@Param("id") UUID id);

    /**
     * Find system default categories
     */
    List<FileCategory> findByIsSystemDefaultTrueAndDeletedFalse();
}
