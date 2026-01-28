package com.terrarosa.terra_crm.modules.auth.service;

import com.terrarosa.terra_crm.core.security.config.PermissionEvaluator;
import com.terrarosa.terra_crm.core.security.service.JwtService;
import com.terrarosa.terra_crm.core.tenancy.entity.Tenant;
import com.terrarosa.terra_crm.core.tenancy.service.TenantService;
import com.terrarosa.terra_crm.modules.auth.entity.User;
import com.terrarosa.terra_crm.modules.auth.repository.SuperAdminRepository;
import com.terrarosa.terra_crm.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Service for tenant security and isolation validation.
 * Provides methods to extract tenant information from SecurityContext and validate tenant access.
 * 
 * CRITICAL: This service ensures that tenant admin operations are isolated to their own tenant.
 * Super Admin users are handled specially - they use SYSTEM tenant ID.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TenantSecurityService {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final SuperAdminRepository superAdminRepository;
    private final TenantService tenantService;

    /**
     * Extract tenant ID from JWT token in SecurityContext.
     * 
     * CRITICAL: Super Admin users always return SYSTEM tenant ID, regardless of JWT content.
     * This ensures Super Admin can access tenant-admin endpoints without tenant isolation errors.
     * 
     * @return Current user's tenant ID (SYSTEM tenant ID for Super Admin)
     * @throws BadCredentialsException if user is not authenticated or token is invalid
     */
    @Transactional(readOnly = true)
    public UUID getCurrentUserTenantId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            log.warn("getCurrentUserTenantId called but user is not authenticated");
            throw new BadCredentialsException("User is not authenticated");
        }
        
        // CRITICAL: Check if user is Super Admin first
        // Super Admin always uses SYSTEM tenant ID
        UUID currentUserId = getCurrentUserId();
        if (superAdminRepository.existsByUserId(currentUserId)) {
            Tenant systemTenant = tenantService.getSystemTenant();
            log.debug("Super Admin detected - returning SYSTEM tenant ID: {}", systemTenant.getId());
            return systemTenant.getId();
        }
        
        // Extract token from authentication details
        String token = extractTokenFromAuthentication(authentication);
        
        if (token == null || token.isBlank()) {
            log.error("Token not found in authentication details");
            throw new BadCredentialsException("Invalid authentication token");
        }
        
        // Extract tenant ID from JWT
        String tenantIdStr = jwtService.extractTenantId(token);
        
        if (tenantIdStr == null || tenantIdStr.isBlank()) {
            log.error("Tenant ID not found in JWT token");
            throw new BadCredentialsException("Invalid JWT token: missing tenantId");
        }
        
        try {
            return UUID.fromString(tenantIdStr);
        } catch (IllegalArgumentException e) {
            log.error("Invalid tenantId format in JWT: {}", tenantIdStr);
            throw new BadCredentialsException("Invalid tenant ID format");
        }
    }

    /**
     * Extract user ID from JWT token (via email lookup).
     * 
     * @return Current user's ID
     * @throws BadCredentialsException if user is not authenticated or user not found
     */
    @Transactional(readOnly = true)
    public UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            log.warn("getCurrentUserId called but user is not authenticated");
            throw new BadCredentialsException("User is not authenticated");
        }
        
        // Extract token from authentication details
        String token = extractTokenFromAuthentication(authentication);
        
        if (token == null || token.isBlank()) {
            log.error("Token not found in authentication details");
            throw new BadCredentialsException("Invalid authentication token");
        }
        
        // Extract email from JWT
        String email = jwtService.extractEmail(token);
        
        if (email == null || email.isBlank()) {
            log.error("Email not found in JWT token");
            throw new BadCredentialsException("Invalid JWT token: missing email");
        }
        
        // Look up user by email to get ID
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.error("User not found with email: {}", email);
                    return new BadCredentialsException("User not found");
                });
        
        return user.getId();
    }

    /**
     * Validate that the target tenant ID matches the current user's tenant ID.
     * 
     * @param targetTenantId Tenant ID to validate
     * @throws AccessDeniedException if tenant IDs don't match
     */
    @Transactional(readOnly = true)
    public void validateTenantAccess(UUID targetTenantId) {
        UUID currentTenantId = getCurrentUserTenantId();
        
        if (!currentTenantId.equals(targetTenantId)) {
            log.error("Tenant access denied: Current tenantId={}, Target tenantId={}", 
                    currentTenantId, targetTenantId);
            throw new AccessDeniedException(
                    String.format("Access denied: Tenant ID mismatch. You can only access resources from your own tenant."));
        }
        
        log.debug("Tenant access validated: tenantId={}", currentTenantId);
    }

    /**
     * Validate that a user belongs to the current tenant.
     * 
     * @param userId User ID to validate
     * @throws AccessDeniedException if user doesn't belong to current tenant
     * @throws IllegalArgumentException if user not found
     */
    @Transactional(readOnly = true)
    public void validateUserBelongsToTenant(UUID userId) {
        UUID currentTenantId = getCurrentUserTenantId();
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        
        UUID userTenantId = user.getTenant().getId();
        
        if (!currentTenantId.equals(userTenantId)) {
            log.error("User tenant mismatch: Current tenantId={}, User tenantId={}, UserId={}", 
                    currentTenantId, userTenantId, userId);
            throw new AccessDeniedException(
                    String.format("Access denied: User %s does not belong to your tenant.", userId));
        }
        
        log.debug("User tenant validated: userId={}, tenantId={}", userId, currentTenantId);
    }

    /**
     * CRITICAL: Validate that a user is active and belongs to the current tenant.
     * This method performs both JWT and database validation to ensure consistency.
     * 
     * Steps:
     * 1. Extract tenantId from JWT (getCurrentUserTenantId)
     * 2. Query database for user
     * 3. Verify user is enabled and not deleted
     * 4. Verify user's tenantId matches JWT tenantId
     * 
     * @param userId User ID to validate
     * @throws AccessDeniedException if user doesn't belong to current tenant or is inactive
     * @throws IllegalArgumentException if user not found
     */
    @Transactional(readOnly = true)
    public void validateUserActiveAndBelongsToTenant(UUID userId) {
        UUID currentTenantId = getCurrentUserTenantId();
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found with id: {}", userId);
                    return new IllegalArgumentException("User not found with id: " + userId);
                });
        
        // Check if user is enabled
        if (!Boolean.TRUE.equals(user.getEnabled())) {
            log.error("User is disabled: userId={}", userId);
            throw new AccessDeniedException(
                    String.format("Access denied: User %s is disabled.", userId));
        }
        
        // Check if user is deleted
        if (Boolean.TRUE.equals(user.getDeleted())) {
            log.error("User is deleted: userId={}", userId);
            throw new AccessDeniedException(
                    String.format("Access denied: User %s has been deleted.", userId));
        }
        
        // Check tenant match
        UUID userTenantId = user.getTenant().getId();
        if (!currentTenantId.equals(userTenantId)) {
            log.error("User tenant mismatch (JWT vs DB): Current tenantId={}, User tenantId={}, UserId={}", 
                    currentTenantId, userTenantId, userId);
            throw new AccessDeniedException(
                    String.format("Access denied: User %s does not belong to your tenant.", userId));
        }
        
        log.debug("User active and tenant validated: userId={}, tenantId={}, enabled={}, deleted={}", 
                userId, currentTenantId, user.getEnabled(), user.getDeleted());
    }

    /**
     * Extract JWT token from Authentication object.
     * 
     * @param authentication Authentication object from SecurityContext
     * @return JWT token string or null if not found
     */
    private String extractTokenFromAuthentication(Authentication authentication) {
        Object details = authentication.getDetails();
        if (details instanceof PermissionEvaluator.JwtAuthenticationDetails) {
            PermissionEvaluator.JwtAuthenticationDetails jwtDetails = 
                    (PermissionEvaluator.JwtAuthenticationDetails) details;
            return jwtDetails.getToken();
        }
        return null;
    }
}
