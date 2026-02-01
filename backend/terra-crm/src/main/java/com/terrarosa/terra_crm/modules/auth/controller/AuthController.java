package com.terrarosa.terra_crm.modules.auth.controller;

import com.terrarosa.terra_crm.core.common.dto.ApiResponse;
import com.terrarosa.terra_crm.modules.auth.dto.LoginRequest;
import com.terrarosa.terra_crm.modules.auth.dto.LoginResponse;
import com.terrarosa.terra_crm.modules.auth.dto.LogoutRequest;
import com.terrarosa.terra_crm.modules.auth.dto.RefreshTokenRequest;
import com.terrarosa.terra_crm.modules.auth.dto.RefreshTokenResponse;
import com.terrarosa.terra_crm.modules.auth.dto.RegisterRequest;
import com.terrarosa.terra_crm.modules.auth.dto.TenantDiscoveryRequest;
import com.terrarosa.terra_crm.modules.auth.dto.TenantDiscoveryResponse;
import com.terrarosa.terra_crm.modules.auth.dto.CurrentUserResponse;
import com.terrarosa.terra_crm.modules.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String TENANT_HEADER = "X-Tenant-ID";

    private final AuthService authService;

    /**
     * Login endpoint.
     * Public endpoint - no authentication required.
     *
     * Stateless API: Returns access token and refresh token in JSON body (no cookies).
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        String tenantId = httpRequest.getHeader(TENANT_HEADER);

        if (tenantId == null || tenantId.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("BAD_REQUEST", "X-Tenant-ID header is required"));
        }

        LoginResponse response = authService.login(request, tenantId);
        return ResponseEntity.ok()
                .body(ApiResponse.success(response, "Login successful"));
    }

    /**
     * Refresh access token endpoint.
     * Public endpoint - no authentication required.
     *
     * Stateless API: Accepts refresh token in request body; returns new tokens in JSON body.
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<RefreshTokenResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest body) {

        String refreshToken = body != null ? body.getRefreshToken() : null;
        if (refreshToken == null || refreshToken.isBlank()) {
            log.warn("Refresh token not provided");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Refresh token is required"));
        }

        try {
            RefreshTokenResponse response = authService.refreshToken(refreshToken);
            return ResponseEntity.ok()
                    .body(ApiResponse.success(response, "Token refreshed successfully"));
        } catch (Exception e) {
            log.error("Failed to refresh token: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Invalid or expired refresh token"));
        }
    }

    /**
     * Logout endpoint.
     * Public endpoint - no authentication required.
     *
     * Optional body with refreshToken revokes it server-side.
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestBody(required = false) LogoutRequest body) {

        String refreshToken = body != null ? body.getRefreshToken() : null;
        if (refreshToken != null && !refreshToken.isBlank()) {
            try {
                authService.revokeRefreshToken(refreshToken);
                log.debug("Revoked refresh token during logout");
            } catch (Exception e) {
                log.warn("Failed to revoke refresh token during logout: {}", e.getMessage());
            }
        }

        return ResponseEntity.ok()
                .body(ApiResponse.success(null, "Logout successful"));
    }

    /**
     * Tenant discovery endpoint.
     * Public endpoint - no authentication required.
     */
    @PostMapping("/discover")
    public ResponseEntity<ApiResponse<TenantDiscoveryResponse>> discoverTenants(
            @Valid @RequestBody TenantDiscoveryRequest request) {

        TenantDiscoveryResponse response = authService.discoverTenants(request);
        return ResponseEntity.ok()
                .body(ApiResponse.success(response, "Tenant discovery completed"));
    }

    /**
     * Get current authenticated user information.
     * Requires valid JWT in Authorization: Bearer header.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<CurrentUserResponse>> getCurrentUser() {
        CurrentUserResponse response = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(response, "Current user retrieved"));
    }

    /**
     * Register endpoint.
     * DEPRECATED: Public registration is disabled.
     */
    @PostMapping("/register")
    @Deprecated
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("FORBIDDEN",
                        "Public registration is disabled. Please contact Super Admin to create your tenant."));
    }
}
