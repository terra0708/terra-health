package com.terrarosa.terra_crm.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for refresh token response.
 * Contains new access token and refresh token.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshTokenResponse {
    
    private String accessToken;
    private String refreshToken; // Will be sent as HttpOnly cookie by controller
    private Long expiresIn; // Access token expiration in milliseconds (15 minutes)
}
