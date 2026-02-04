package com.terrarosa.terra_crm.modules.health.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReminderStatusRequest {

    @NotBlank(message = "Turkish label is required")
    private String labelTr;

    @NotBlank(message = "English label is required")
    private String labelEn;

    private String value;
    private String color;
    private Boolean isCompleted;
}
