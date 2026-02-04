package com.terrarosa.terra_crm.modules.health.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParameterRequest {

    @NotBlank(message = "Turkish label is required")
    @Size(max = 100, message = "Turkish label must not exceed 100 characters")
    private String labelTr;

    @NotBlank(message = "English label is required")
    @Size(max = 100, message = "English label must not exceed 100 characters")
    private String labelEn;

    @Size(max = 100, message = "Value must not exceed 100 characters")
    private String value;

    @NotBlank(message = "Color is required")
    @Size(max = 20, message = "Color must not exceed 20 characters")
    private String color;

    @Size(max = 50, message = "Icon must not exceed 50 characters")
    private String icon;
}
