package com.terrarosa.terra_crm.modules.auth.controller;

import com.terrarosa.terra_crm.core.common.dto.ApiResponse;
import com.terrarosa.terra_crm.modules.auth.service.TenantSecurityService;
import com.terrarosa.terra_crm.modules.auth.dto.UserProfileDto;
import com.terrarosa.terra_crm.modules.auth.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Tenant admin endpoints for managing tenant-specific user profiles.
 *
 * <p>CRITICAL: This controller only handles profile data stored in tenant schemas.
 * Auth identity remains in public.users.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/tenant-admin")
@RequiredArgsConstructor
public class TenantUserProfileController {

    private final TenantSecurityService tenantSecurityService;
    private final UserProfileService userProfileService;

    /**
     * Get profile information for a user within the current tenant.
     */
    @GetMapping("/users/{userId}/profile")
    @PreAuthorize("hasAnyAuthority('SETTINGS_USERS', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserProfileDto>> getUserProfile(@PathVariable UUID userId) {
        tenantSecurityService.validateUserActiveAndBelongsToTenant(userId);

        UserProfileDto profile = userProfileService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    /**
     * Create or update profile information for a user within the current tenant.
     */
    @PutMapping("/users/{userId}/profile")
    @PreAuthorize("hasAnyAuthority('SETTINGS_USERS', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserProfileDto>> upsertUserProfile(
            @PathVariable UUID userId,
            @RequestBody UserProfileDto request) {

        tenantSecurityService.validateUserActiveAndBelongsToTenant(userId);

        UserProfileDto updated = userProfileService.upsertProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "User profile updated successfully"));
    }
}

