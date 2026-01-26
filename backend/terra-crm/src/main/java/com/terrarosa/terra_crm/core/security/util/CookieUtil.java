package com.terrarosa.terra_crm.core.security.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Utility class for creating HTTP-only cookies for refresh tokens.
 * 
 * CRITICAL: Refresh token cookies are configured with:
 * - HttpOnly: true (JavaScript cannot access)
 * - Secure: configurable (false for development, true for production)
 * - SameSite: Lax (CSRF protection)
 * - Path: /api/v1/auth/refresh (Cookie is only sent to refresh endpoint)
 */
@Component
public class CookieUtil {
    
    private static final String REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
    private static final String COOKIE_PATH = "/api/v1/auth/refresh";
    private static final String SAME_SITE_LAX = "Lax";
    
    @Value("${jwt.refresh-expiration:604800000}")
    private Long refreshExpiration; // Default: 7 days
    
    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure; // Default: false for development
    
    /**
     * Create a refresh token cookie.
     * 
     * CRITICAL: Path is set to /api/v1/auth/refresh so cookie is only sent
     * to refresh endpoint, not to every API request (performance + security).
     * 
     * @param token Refresh token string
     * @return ResponseCookie configured with security settings
     */
    public ResponseCookie createRefreshTokenCookie(String token) {
        Duration maxAge = Duration.ofMillis(refreshExpiration);
        
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, token)
                .httpOnly(true) // JavaScript cannot access
                .secure(cookieSecure) // HTTPS only in production
                .sameSite(SAME_SITE_LAX) // CSRF protection
                .path(COOKIE_PATH) // CRITICAL: Only sent to refresh endpoint
                .maxAge(maxAge)
                .build();
    }
    
    /**
     * Create an empty cookie to clear/delete refresh token cookie.
     * Used during logout or when refresh token is invalidated.
     * 
     * @return ResponseCookie with MaxAge(0) to delete cookie
     */
    public ResponseCookie clearRefreshTokenCookie() {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(SAME_SITE_LAX)
                .path(COOKIE_PATH) // Same path as creation
                .maxAge(Duration.ZERO) // Delete cookie
                .build();
    }
    
    /**
     * Get refresh token cookie name.
     */
    public static String getRefreshTokenCookieName() {
        return REFRESH_TOKEN_COOKIE_NAME;
    }
}
