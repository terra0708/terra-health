package com.terrarosa.terra_crm.modules.health.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReminderRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String note;

    @NotNull(message = "Reminder date is required")
    private LocalDate reminderDate;

    @NotNull(message = "Reminder time is required")
    private LocalTime reminderTime;

    @NotNull(message = "Category ID is required")
    private UUID categoryId;

    private UUID subcategoryId;

    @NotNull(message = "Status ID is required")
    private UUID statusId;

    private String relationType;
    private UUID relationId;
}
