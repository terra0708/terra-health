package com.terrarosa.terra_crm.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTO for current user information including impersonation status.
 * Used by /api/v1/auth/me endpoint to return user context without exposing JWT token.
 * 
 * CRITICAL: This DTO extends UserDto with impersonation fields.
 * All user data is extracted from JWT claims (no database query for performance).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurrentUserResponse {

    // User basic information (from JWT claims)
    private UUID id; // User ID - may need DB lookup if not in JWT
    private String email;
    private String firstName; // May need DB lookup if not in JWT
    private String lastName; // May need DB lookup if not in JWT
    private UUID tenantId;
    private List<String> roles;
    private List<String> permissions; // Expanded from compressed format in JWT

    // Impersonation information (from JWT claims)
    private Boolean isImpersonation; // Whether current session is impersonation
    private String impersonatedEmail; // Email of impersonated user (if impersonation active)
    private String originalUserId; // UUID of Super Admin who started impersonation (if impersonation active)
    private String originalEmail; // Email of Super Admin (optional, for display - may need DB lookup)
}
