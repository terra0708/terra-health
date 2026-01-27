package com.terrarosa.terra_crm.modules.auth.dto;

import lombok.Data;
import jakarta.validation.constraints.Size;

@Data
public class UpdateTenantRequest {
    @Size(min = 2, max = 255)
    private String name;

    @Size(min = 2, max = 255)
    private String domain;

    private Integer maxUsers;
}
