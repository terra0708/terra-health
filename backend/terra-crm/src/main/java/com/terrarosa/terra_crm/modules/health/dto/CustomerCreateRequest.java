package com.terrarosa.terra_crm.modules.health.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerCreateRequest {
    private UUID leadId;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Phone is required")
    private String phone;

    private String email;

    @NotBlank(message = "Country is required")
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
    private java.time.LocalDateTime registrationDate;
    private List<String> services;
    private List<String> tags;
    private List<Map<String, Object>> notes;
    private List<Map<String, Object>> files;
    private List<Map<String, Object>> payments;
}
