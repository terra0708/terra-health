package com.terrarosa.terra_crm.modules.ads.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadCreateRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Phone is required")
    private String phone;

    private String email;

    @NotBlank(message = "Country is required")
    private String country;

    @NotBlank(message = "Source is required")
    private String source;

    private Map<String, Object> dynamicData;

    private UUID serviceId;

    private UUID assignedTo;

    @NotBlank(message = "Status is required")
    private String status;
}
