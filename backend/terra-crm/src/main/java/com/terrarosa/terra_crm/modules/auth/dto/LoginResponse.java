package com.terrarosa.terra_crm.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    
    private String token; // Access token
    private UserDto user;
    private Long expiresIn; // Access token expiration (15 minutes)
    private String refreshToken; // Refresh token (will be sent as HttpOnly cookie, included here for service layer)
}
