package com.terrarosa.terra_crm.modules.health.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDto {
    private UUID id;
    private UUID leadId;
    private String name;
    private String phone;
    private String email;
    private String country;
    private String city;
    private String job;
    private String medicalHistory;
    private String operationType;
    private String passportNumber;
    private String status;
    private UUID consultantId;
    private List<String> categories;
    private String source;
    private LocalDateTime registrationDate;
    private List<String> services;
    private List<String> tags;
    private List<Map<String, Object>> notes;
    private List<Map<String, Object>> files;
    private List<Map<String, Object>> payments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
