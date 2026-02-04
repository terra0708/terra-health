package com.terrarosa.terra_crm.modules.health.repository;

import com.terrarosa.terra_crm.modules.health.entity.ReminderSubcategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReminderSubcategoryRepository extends JpaRepository<ReminderSubcategory, UUID> {
    List<ReminderSubcategory> findByCategoryId(UUID categoryId);

    Optional<ReminderSubcategory> findByValueAndCategoryId(String value, UUID categoryId);
}
