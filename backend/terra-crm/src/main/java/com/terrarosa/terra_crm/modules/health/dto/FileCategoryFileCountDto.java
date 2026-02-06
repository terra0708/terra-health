package com.terrarosa.terra_crm.modules.health.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileCategoryFileCountDto {
    private UUID categoryId;
    private Long fileCount;
}
