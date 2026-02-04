package com.terrarosa.terra_crm.modules.health.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceRequest {

    @NotBlank(message = "Turkish name is required")
    @Size(max = 100, message = "Turkish name must not exceed 100 characters")
    private String nameTr;

    @NotBlank(message = "English name is required")
    @Size(max = 100, message = "English name must not exceed 100 characters")
    private String nameEn;

    @Size(max = 100, message = "Value must not exceed 100 characters")
    private String value;

    @NotNull(message = "Category ID is required")
    private UUID categoryId;

    @NotBlank(message = "Color is required")
    @Size(max = 20, message = "Color must not exceed 20 characters")
    private String color;

    @Size(max = 50, message = "Icon must not exceed 50 characters")
    private String icon;
}
