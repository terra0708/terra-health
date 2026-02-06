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
public class CustomerFileDto {
    private UUID id;
    private UUID customerId;
    private String customerName;
    private UUID categoryId;
    private String displayName;
    private String originalFilename;
    private String mimeType;
    private Long fileSize;
    private UUID uploadedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isDeleted;
    private LocalDateTime deletedAt;
    private LocalDateTime autoDeleteAt; // For frontend countdown
}
