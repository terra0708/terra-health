package com.terrarosa.terra_crm.modules.health.repository;

import com.terrarosa.terra_crm.modules.health.entity.ReminderCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReminderCategoryRepository extends JpaRepository<ReminderCategory, UUID> {
    Optional<ReminderCategory> findByLabelEn(String labelEn);
}
