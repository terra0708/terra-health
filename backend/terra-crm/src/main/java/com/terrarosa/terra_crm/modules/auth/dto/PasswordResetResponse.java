package com.terrarosa.terra_crm.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Response DTO for password reset operations initiated by tenant admins.
 *
 * <p>Contains the newly generated temporary password. This value must only be
 * shown once in the UI and must never be logged or stored in plain text.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetResponse {

    private UUID userId;

    /**
     * Newly generated temporary password for the user.
     */
    private String generatedPassword;
}

