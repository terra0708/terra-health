package com.terrarosa.terra_crm.modules.health.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadDto {
    
    private UUID id;
    private String name;
    private String phone;
    private String email;
    private String country;
    private String source;
    private Map<String, Object> dynamicData;
    private UUID serviceId;
    private String serviceName;
    private UUID assignedTo;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
