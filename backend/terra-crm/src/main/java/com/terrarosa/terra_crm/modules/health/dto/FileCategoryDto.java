package com.terrarosa.terra_crm.modules.health.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileCategoryDto {
    private UUID id;
    private String labelTr;
    private String labelEn;
    private String color;
    private String icon;
    private Boolean isSystemDefault;
    private Boolean isDeletable;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
