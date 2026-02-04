package com.terrarosa.terra_crm.modules.health.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReminderDto {
    private UUID id;
    private String title;
    private String note;
    private LocalDate reminderDate;
    private LocalTime reminderTime;

    private UUID categoryId;
    private String categoryLabelTr;
    private String categoryLabelEn;
    private String categoryColor;

    private UUID subcategoryId;
    private String subcategoryLabelTr;
    private String subcategoryLabelEn;

    private UUID statusId;
    private String statusLabelTr;
    private String statusLabelEn;
    private String statusColor;
    private Boolean statusIsCompleted;

    private String relationType;
    private UUID relationId;
    private String relationName; // Customer name, etc.

    private Boolean isCompleted;
    private LocalDateTime completedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
    private UUID updatedBy;
}
