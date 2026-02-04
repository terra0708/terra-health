package com.terrarosa.terra_crm.modules.health.repository;

import com.terrarosa.terra_crm.modules.health.entity.ReminderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReminderStatusRepository extends JpaRepository<ReminderStatus, UUID> {
    Optional<ReminderStatus> findByValue(String value);
}
