package com.terrarosa.terra_crm.modules.auth.controller;

import com.terrarosa.terra_crm.core.common.dto.ApiResponse;
import com.terrarosa.terra_crm.core.security.util.CookieUtil;
import com.terrarosa.terra_crm.modules.auth.dto.LoginRequest;
import com.terrarosa.terra_crm.modules.auth.dto.LoginResponse;
import com.terrarosa.terra_crm.modules.auth.dto.RefreshTokenResponse;
import com.terrarosa.terra_crm.modules.auth.dto.RegisterRequest;
import com.terrarosa.terra_crm.modules.auth.dto.TenantDiscoveryRequest;
import com.terrarosa.terra_crm.modules.auth.dto.TenantDiscoveryResponse;
import com.terrarosa.terra_crm.modules.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private static final String TENANT_HEADER = "X-Tenant-ID";
    
    private final AuthService authService;
    private final CookieUtil cookieUtil;
    
    /**
     * Login endpoint.
     * Public endpoint - no authentication required.
     * 
     * Returns:
     * - Access token in JSON body (15 minutes expiry)
     * - Refresh token in HttpOnly cookie (7 days expiry, Path: /api/v1/auth/refresh)
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        
        // Get tenant ID from header
        String tenantId = httpRequest.getHeader(TENANT_HEADER);
        
        if (tenantId == null || tenantId.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("BAD_REQUEST", "X-Tenant-ID header is required"));
        }
        
        LoginResponse response = authService.login(request, tenantId);
        
        // Create access token cookie
        ResponseCookie accessTokenCookie = cookieUtil.createAccessTokenCookie(response.getToken());
        
        // Create refresh token cookie
        ResponseCookie refreshTokenCookie = cookieUtil.createRefreshTokenCookie(response.getRefreshToken());
        
        // Remove both tokens from response body (they're in cookies)
        LoginResponse responseWithoutTokens = LoginResponse.builder()
                .user(response.getUser())
                .expiresIn(response.getExpiresIn())
                .build();
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                .body(ApiResponse.success(responseWithoutTokens, "Login successful"));
    }
    
    /**
     * Refresh access token endpoint.
     * Public endpoint - no authentication required.
     * 
     * Reads refresh token from HttpOnly cookie.
     * Implements token rotation: old refresh token is invalidated, new one is created.
     * 
     * Returns:
     * - New access token in JSON body (15 minutes expiry)
     * - New refresh token in HttpOnly cookie (7 days expiry, Path: /api/v1/auth/refresh)
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<RefreshTokenResponse>> refreshToken(
            @CookieValue(name = "refreshToken", required = false) String refreshToken) {
        
        if (refreshToken == null || refreshToken.isBlank()) {
            log.warn("Refresh token cookie not found");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Refresh token not found"));
        }
        
        try {
            RefreshTokenResponse response = authService.refreshToken(refreshToken);
            
            // Create access token cookie
            ResponseCookie accessTokenCookie = cookieUtil.createAccessTokenCookie(response.getAccessToken());
            
            // Remove both tokens from response body (they're in cookies)
            RefreshTokenResponse responseWithoutTokens = RefreshTokenResponse.builder()
                    .expiresIn(response.getExpiresIn())
                    .build();
            
            ResponseEntity.BodyBuilder responseBuilder = ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString());
            
            // Only update cookie if new refresh token is provided (token rotation occurred)
            if (response.getRefreshToken() != null && !response.getRefreshToken().isBlank()) {
                // Create new refresh token cookie (token rotation)
                ResponseCookie refreshTokenCookie = cookieUtil.createRefreshTokenCookie(response.getRefreshToken());
                responseBuilder.header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString());
                log.debug("Refresh token cookie updated (token rotation)");
            } else {
                // Grace period: Keep existing cookie, don't update
                log.debug("Refresh token cookie not updated (grace period)");
            }
            
            return responseBuilder
                    .body(ApiResponse.success(responseWithoutTokens, "Token refreshed successfully"));
        } catch (Exception e) {
            log.error("Failed to refresh token: {}", e.getMessage());
            
            // Clear invalid cookies
            ResponseCookie clearAccessCookie = cookieUtil.clearAccessTokenCookie();
            ResponseCookie clearRefreshCookie = cookieUtil.clearRefreshTokenCookie();
            
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .header(HttpHeaders.SET_COOKIE, clearAccessCookie.toString())
                    .header(HttpHeaders.SET_COOKIE, clearRefreshCookie.toString())
                    .body(ApiResponse.error("UNAUTHORIZED", "Invalid or expired refresh token"));
        }
    }
    
    /**
     * Logout endpoint.
     * Public endpoint - no authentication required.
     * 
     * Reads refresh token from HttpOnly cookie, revokes it in database,
     * and clears both access and refresh token cookies.
     * 
     * CRITICAL: This endpoint must be public (no authentication) because
     * if the access token is expired, user should still be able to logout.
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @CookieValue(name = "refreshToken", required = false) String refreshToken) {
        
        // Revoke refresh token if present
        if (refreshToken != null && !refreshToken.isBlank()) {
            try {
                authService.revokeRefreshToken(refreshToken);
                log.debug("Revoked refresh token during logout");
            } catch (Exception e) {
                log.warn("Failed to revoke refresh token during logout: {}", e.getMessage());
                // Continue with cookie cleanup even if revoke fails
            }
        }
        
        // Clear both cookies
        ResponseCookie clearAccessCookie = cookieUtil.clearAccessTokenCookie();
        ResponseCookie clearRefreshCookie = cookieUtil.clearRefreshTokenCookie();
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearAccessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie.toString())
                .body(ApiResponse.success(null, "Logout successful"));
    }
    
    /**
     * Tenant discovery endpoint.
     * Public endpoint - no authentication required.
     * 
     * Discovers which tenant(s) a user belongs to based on their email address.
     * This allows the frontend to automatically determine the tenant without requiring
     * manual tenant ID input.
     * 
     * SECURITY: Always returns success response, even if no tenants found.
     * This prevents user enumeration attacks.
     * 
     * Returns:
     * - List of TenantInfo objects (single tenant: one element, multiple tenants: multiple elements)
     * - Empty list if no tenants found (but still success response)
     */
    @PostMapping("/discover")
    public ResponseEntity<ApiResponse<TenantDiscoveryResponse>> discoverTenants(
            @Valid @RequestBody TenantDiscoveryRequest request) {
        
        TenantDiscoveryResponse response = authService.discoverTenants(request);
        
        // Always return success to prevent user enumeration
        // Even if tenants list is empty, return success with empty list
        return ResponseEntity.ok()
                .body(ApiResponse.success(response, "Tenant discovery completed"));
    }
    
    /**
     * Register endpoint.
     * DEPRECATED: Public registration is disabled. Use Super Admin endpoint to create tenants.
     * This endpoint is kept for backward compatibility but returns an error.
     */
    @PostMapping("/register")
    @Deprecated
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("FORBIDDEN", 
                    "Public registration is disabled. Please contact Super Admin to create your tenant."));
    }
}
