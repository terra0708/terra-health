package com.terrarosa.terra_crm.modules.health.repository;

import com.terrarosa.terra_crm.modules.health.entity.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReminderRepository extends JpaRepository<Reminder, UUID> {
    List<Reminder> findByRelationTypeAndRelationId(String relationType, UUID relationId);

    List<Reminder> findByReminderDateBetween(LocalDate startDate, LocalDate endDate);

    List<Reminder> findByCategoryId(UUID categoryId);

    List<Reminder> findByStatusId(UUID statusId);
}
