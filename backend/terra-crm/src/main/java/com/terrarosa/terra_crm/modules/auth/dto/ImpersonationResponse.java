package com.terrarosa.terra_crm.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for impersonation response.
 * Contains the impersonation JWT token.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImpersonationResponse {
    
    private String impersonationToken;
    private String impersonatedUserEmail;
    private String impersonatedUserId;
    private String tenantId;
    private String tenantName;
}
