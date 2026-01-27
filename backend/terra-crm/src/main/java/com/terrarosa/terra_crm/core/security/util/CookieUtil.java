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
    private static final String ACCESS_TOKEN_COOKIE_NAME = "accessToken";
    private static final String REFRESH_TOKEN_COOKIE_PATH = "/api/v1/auth/refresh";
    private static final String ACCESS_TOKEN_COOKIE_PATH = "/api/v1";
    private static final String SAME_SITE_LAX = "Lax";
    private static final String SAME_SITE_STRICT = "Strict";
    
    @Value("${jwt.refresh-expiration:604800000}")
    private Long refreshExpiration; // Default: 7 days
    
    @Value("${jwt.expiration:900000}")
    private Long accessTokenExpiration; // Default: 15 minutes
    
    @Value("${app.cookie.secure:true}")
    private boolean cookieSecure; // Default: true (HTTPS zorunlu)
    
    /**
     * Create an access token cookie.
     * 
     * CRITICAL: Path is set to /api/v1 so cookie is sent to all API requests.
     * SameSite=Lax for deep-link support.
     * 
     * @param token Access token string
     * @return ResponseCookie configured with security settings
     */
    public ResponseCookie createAccessTokenCookie(String token) {
        Duration maxAge = Duration.ofSeconds(accessTokenExpiration / 1000); // Convert milliseconds to seconds
        
        return ResponseCookie.from(ACCESS_TOKEN_COOKIE_NAME, token)
                .httpOnly(true) // JavaScript cannot access
                .secure(cookieSecure) // HTTPS only
                .sameSite(SAME_SITE_LAX) // Deep-link desteği için
                .path(ACCESS_TOKEN_COOKIE_PATH) // CRITICAL: Sent to all API requests
                .maxAge(maxAge)
                .build();
    }
    
    /**
     * Create an empty cookie to clear/delete access token cookie.
     * Used during logout or when access token is invalidated.
     * 
     * @return ResponseCookie with MaxAge(0) to delete cookie
     */
    public ResponseCookie clearAccessTokenCookie() {
        return ResponseCookie.from(ACCESS_TOKEN_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(SAME_SITE_LAX)
                .path(ACCESS_TOKEN_COOKIE_PATH) // Same path as creation
                .maxAge(Duration.ZERO) // Delete cookie
                .build();
    }
    
    /**
     * Create a refresh token cookie.
     * 
     * CRITICAL: Path is set to /api/v1/auth/refresh so cookie is only sent
     * to refresh endpoint, not to every API request (performance + security).
     * SameSite=Strict for CSRF protection.
     * 
     * @param token Refresh token string
     * @return ResponseCookie configured with security settings
     */
    public ResponseCookie createRefreshTokenCookie(String token) {
        Duration maxAge = Duration.ofMillis(refreshExpiration);
        
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, token)
                .httpOnly(true) // JavaScript cannot access
                .secure(cookieSecure) // HTTPS only
                .sameSite(SAME_SITE_STRICT) // CSRF protection (Strict)
                .path(REFRESH_TOKEN_COOKIE_PATH) // CRITICAL: Only sent to refresh endpoint
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
                .sameSite(SAME_SITE_STRICT) // SameSite=Strict
                .path(REFRESH_TOKEN_COOKIE_PATH) // Same path as creation
                .maxAge(Duration.ZERO) // Delete cookie
                .build();
    }
    
    /**
     * Get refresh token cookie name.
     */
    public static String getRefreshTokenCookieName() {
        return REFRESH_TOKEN_COOKIE_NAME;
    }
    
    /**
     * Get access token cookie name.
     */
    public static String getAccessTokenCookieName() {
        return ACCESS_TOKEN_COOKIE_NAME;
    }
}
