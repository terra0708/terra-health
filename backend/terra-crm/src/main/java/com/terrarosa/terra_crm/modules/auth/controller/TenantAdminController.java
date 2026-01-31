package com.terrarosa.terra_crm.modules.auth.controller;

import com.terrarosa.terra_crm.core.common.dto.ApiResponse;
import com.terrarosa.terra_crm.modules.auth.dto.BundleDto;
import com.terrarosa.terra_crm.modules.auth.dto.ModuleDTO;
import com.terrarosa.terra_crm.modules.auth.dto.PermissionResponseDTO;
import com.terrarosa.terra_crm.modules.auth.dto.UserDto;
import com.terrarosa.terra_crm.modules.auth.entity.Permission;
import com.terrarosa.terra_crm.modules.auth.entity.PermissionBundle;
import com.terrarosa.terra_crm.modules.auth.entity.User;
import com.terrarosa.terra_crm.modules.auth.repository.UserRepository;
import com.terrarosa.terra_crm.modules.auth.service.PermissionService;
import com.terrarosa.terra_crm.modules.auth.service.TenantSecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Controller for tenant admin operations.
 * All endpoints require ROLE_ADMIN or ROLE_SUPER_ADMIN role and enforce tenant isolation.
 * 
 * CRITICAL: This controller ensures that tenant admins can only access
 * resources (users, bundles, permissions) from their own tenant.
 * Super Admin users have access to all tenant resources.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/tenant-admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
public class TenantAdminController {

    private final PermissionService permissionService;
    private final TenantSecurityService tenantSecurityService;
    private final UserRepository userRepository;

    // ========== User Management Endpoints ==========

    /**
     * Get all users belonging to the current tenant.
     */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserDto>>> getTenantUsers() {
        UUID tenantId = tenantSecurityService.getCurrentUserTenantId();
        
        List<User> users = userRepository.findByTenantId(tenantId);
        
        List<UserDto> userDtos = users.stream()
                .map(user -> UserDto.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .tenantId(user.getTenant().getId())
                        .roles(user.getRoles().stream()
                                .map(role -> role.getName())
                                .collect(Collectors.toList()))
                        .build())
                .collect(Collectors.toList());
        
        log.debug("Retrieved {} users for tenant {}", userDtos.size(), tenantId);
        return ResponseEntity.ok(ApiResponse.success(userDtos));
    }

    /**
     * Get user details by ID.
     * Validates that the user belongs to the current tenant.
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<UserDto>> getUserDetails(@PathVariable UUID userId) {
        // CRITICAL: Validate user belongs to current tenant
        tenantSecurityService.validateUserBelongsToTenant(userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        
        UserDto userDto = UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .tenantId(user.getTenant().getId())
                .roles(user.getRoles().stream()
                        .map(role -> role.getName())
                        .collect(Collectors.toList()))
                .permissions(permissionService.getUserPermissions(userId))
                .build();
        
        return ResponseEntity.ok(ApiResponse.success(userDto));
    }

    /**
     * Get permissions for a user.
     * Validates that the user belongs to the current tenant.
     */
    @GetMapping("/users/{userId}/permissions")
    public ResponseEntity<ApiResponse<List<String>>> getUserPermissions(@PathVariable UUID userId) {
        // CRITICAL: Validate user belongs to current tenant
        tenantSecurityService.validateUserBelongsToTenant(userId);
        
        List<String> permissions = permissionService.getUserPermissions(userId);
        return ResponseEntity.ok(ApiResponse.success(permissions));
    }

    /**
     * Assign a permission to a user.
     * CRITICAL: Validates user belongs to tenant AND permission is in tenant's module pool.
     */
    @PostMapping("/users/{userId}/permissions")
    public ResponseEntity<ApiResponse<Void>> assignPermissionToUser(
            @PathVariable UUID userId,
            @RequestBody AssignPermissionRequest request) {
        // CRITICAL: JWT + DB validation for user
        tenantSecurityService.validateUserActiveAndBelongsToTenant(userId);
        
        // PermissionService.assignPermissionToUser already validates permission is in tenant's module pool
        permissionService.assignPermissionToUser(userId, request.getPermissionId());
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(null, "Permission assigned successfully"));
    }

    /**
     * Remove a permission from a user.
     * CRITICAL: Validates user belongs to tenant.
     */
    @DeleteMapping("/users/{userId}/permissions/{permissionId}")
    public ResponseEntity<ApiResponse<Void>> removePermissionFromUser(
            @PathVariable UUID userId,
            @PathVariable UUID permissionId) {
        // CRITICAL: JWT + DB validation for user
        tenantSecurityService.validateUserActiveAndBelongsToTenant(userId);
        
        permissionService.removePermissionFromUser(userId, permissionId);
        return ResponseEntity.ok(ApiResponse.success(null, "Permission removed successfully"));
    }

    // ========== Bundle Management Endpoints ==========

    /**
     * Get all bundles belonging to the current tenant.
     * Returns DTOs with eagerly-loaded permissions.
     * 
     * CRITICAL: DTO mapping happens in service layer within @Transactional context
     * to prevent LazyInitializationException.
     */
    @GetMapping("/bundles")
    public ResponseEntity<ApiResponse<List<BundleDto>>> getTenantBundles() {
        UUID tenantId = tenantSecurityService.getCurrentUserTenantId();
        
        // CRITICAL: DTO mapping service'de yapılıyor (@Transactional context'i içinde)
        List<BundleDto> bundleDtos = permissionService.getTenantBundlesAsDto(tenantId);
        return ResponseEntity.ok(ApiResponse.success(bundleDtos));
    }

    /**
     * Get bundle details by ID.
     * Validates that the bundle belongs to the current tenant.
     */
    @GetMapping("/bundles/{bundleId}")
    public ResponseEntity<ApiResponse<PermissionBundle>> getBundleDetails(@PathVariable UUID bundleId) {
        UUID tenantId = tenantSecurityService.getCurrentUserTenantId();
        
        PermissionBundle bundle = permissionService.getTenantBundles(tenantId).stream()
                .filter(b -> b.getId().equals(bundleId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Bundle not found with id: " + bundleId));
        
        return ResponseEntity.ok(ApiResponse.success(bundle));
    }

    /**
     * Create a new bundle for the current tenant.
     * CRITICAL: tenantId is automatically set from current user's tenant (not from request body).
     */
    @PostMapping("/bundles")
    public ResponseEntity<ApiResponse<PermissionBundle>> createBundle(@RequestBody CreateBundleRequest request) {
        UUID tenantId = tenantSecurityService.getCurrentUserTenantId();
        
        PermissionBundle bundle = permissionService.createBundle(
                tenantId,
                request.getName(),
                request.getDescription(),
                request.getPermissionIds()
        );
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(bundle, "Bundle created successfully"));
    }

    /**
     * Update a bundle.
     * Validates that the bundle belongs to the current tenant.
     */
    @PutMapping("/bundles/{bundleId}")
    public ResponseEntity<ApiResponse<PermissionBundle>> updateBundle(
            @PathVariable UUID bundleId,
            @RequestBody UpdateBundleRequest request) {
        UUID tenantId = tenantSecurityService.getCurrentUserTenantId();
        
        // Validate bundle belongs to tenant
        permissionService.getTenantBundles(tenantId).stream()
                .filter(b -> b.getId().equals(bundleId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Bundle not found with id: " + bundleId));
        
        PermissionBundle bundle = permissionService.updateBundle(bundleId, request.getPermissionIds());
        return ResponseEntity.ok(ApiResponse.success(bundle, "Bundle updated successfully"));
    }

    /**
     * Delete a bundle.
     * CRITICAL: Cascade cleanup - removes bundle permissions from all users.
     */
    @DeleteMapping("/bundles/{bundleId}")
    public ResponseEntity<ApiResponse<Void>> deleteBundle(@PathVariable UUID bundleId) {
        UUID tenantId = tenantSecurityService.getCurrentUserTenantId();
        
        // Validate bundle belongs to tenant
        permissionService.getTenantBundles(tenantId).stream()
                .filter(b -> b.getId().equals(bundleId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Bundle not found with id: " + bundleId));
        
        // CRITICAL: Cascade cleanup - removes permissions from all users
        permissionService.deleteBundle(bundleId);
        
        return ResponseEntity.ok(ApiResponse.success(null, "Bundle deleted successfully. All permissions removed from users."));
    }

    /**
     * Assign a bundle to a user.
     * CRITICAL: Validates both bundle and user belong to tenant.
     */
    @PostMapping("/bundles/{bundleId}/assign/{userId}")
    public ResponseEntity<ApiResponse<Void>> assignBundleToUser(
            @PathVariable UUID bundleId,
            @PathVariable UUID userId) {
        UUID tenantId = tenantSecurityService.getCurrentUserTenantId();
        
        // Validate bundle belongs to tenant
        permissionService.getTenantBundles(tenantId).stream()
                .filter(b -> b.getId().equals(bundleId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Bundle not found with id: " + bundleId));
        
        // CRITICAL: JWT + DB validation for user
        tenantSecurityService.validateUserActiveAndBelongsToTenant(userId);
        
        permissionService.assignBundleToUser(userId, bundleId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(null, "Bundle assigned successfully. Permissions copied to user."));
    }

    /**
     * Remove a bundle from a user.
     * CRITICAL: Validates both bundle and user belong to tenant.
     */
    @DeleteMapping("/bundles/{bundleId}/users/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeBundleFromUser(
            @PathVariable UUID bundleId,
            @PathVariable UUID userId) {
        UUID tenantId = tenantSecurityService.getCurrentUserTenantId();
        
        // Validate bundle belongs to tenant
        permissionService.getTenantBundles(tenantId).stream()
                .filter(b -> b.getId().equals(bundleId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Bundle not found with id: " + bundleId));
        
        // CRITICAL: JWT + DB validation for user
        tenantSecurityService.validateUserActiveAndBelongsToTenant(userId);
        
        // CRITICAL: This method now removes bundle permissions from user_permissions table
        permissionService.removeBundleFromUser(userId, bundleId);
        return ResponseEntity.ok(ApiResponse.success(null, "Bundle removed successfully. Permissions removed from user."));
    }

    // ========== Permission Management Endpoints ==========

    /**
     * Get all available ACTION-level permissions for the current tenant.
     * Returns only permissions from modules assigned to the tenant.
     * 
     * CRITICAL: Returns List<PermissionResponseDTO> with UUID, name, parentId for frontend.
     * Frontend needs UUIDs for bundle creation and parentId for hierarchical grouping.
     * 
     * Super Admin: Returns all ACTION permissions in the system.
     * Tenant Admin: Returns only ACTION permissions from tenant's assigned modules.
     */
    @GetMapping("/permissions")
    public ResponseEntity<ApiResponse<List<PermissionResponseDTO>>> getTenantAvailablePermissions() {
        // Check if Super Admin
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean isSuperAdmin = auth != null && auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        
        List<PermissionResponseDTO> permissions;
        
        if (isSuperAdmin) {
            // Super Admin: Return all ACTION permissions in system
            log.debug("Super Admin detected - returning all ACTION permissions");
            permissions = permissionService.getAllPermissions().stream()
                .filter(p -> p.getType() == com.terrarosa.terra_crm.modules.auth.entity.Permission.PermissionType.ACTION)
                .map(p -> PermissionResponseDTO.builder()
                    .id(p.getId())
                    .name(p.getName())
                    .description(p.getDescription())
                    .type(p.getType())
                    .parentPermissionId(p.getParentPermission() != null ? p.getParentPermission().getId() : null)
                    .parentPermissionName(p.getParentPermission() != null ? p.getParentPermission().getName() : null)
                    .build())
                .collect(Collectors.toList());
        } else {
            // Tenant Admin: Return only tenant's available permissions
            UUID tenantId = tenantSecurityService.getCurrentUserTenantId();
            List<Permission> permissionEntities = permissionService.getTenantAvailablePermissions(tenantId);
            permissions = permissionEntities.stream()
                .map(p -> PermissionResponseDTO.builder()
                    .id(p.getId())
                    .name(p.getName())
                    .description(p.getDescription())
                    .type(p.getType())
                    .parentPermissionId(p.getParentPermission() != null ? p.getParentPermission().getId() : null)
                    .parentPermissionName(p.getParentPermission() != null ? p.getParentPermission().getName() : null)
                    .build())
                .collect(Collectors.toList());
        }
        
        log.debug("Returning {} ACTION permissions for user", permissions.size());
        return ResponseEntity.ok(ApiResponse.success(permissions));
    }

    /**
     * Get all MODULE-level permissions (modules) assigned to the current tenant.
     * Frontend uses this to know which modules are active.
     * 
     * CRITICAL: Returns DTOs to avoid circular reference issues during JSON serialization.
     */
    @GetMapping("/modules")
    public ResponseEntity<ApiResponse<List<ModuleDTO>>> getTenantModules() {
        UUID tenantId = tenantSecurityService.getCurrentUserTenantId();
        
        List<ModuleDTO> modules = permissionService.getTenantModulesAsDto(tenantId);
        return ResponseEntity.ok(ApiResponse.success(modules));
    }

    /**
     * Get all bundles assigned to a user.
     * Validates that the user belongs to the current tenant.
     * Returns DTOs with eagerly-loaded permissions.
     * 
     * CRITICAL: DTO mapping happens in service layer within @Transactional context
     * to prevent LazyInitializationException.
     */
    @GetMapping("/users/{userId}/bundles")
    public ResponseEntity<ApiResponse<List<BundleDto>>> getUserBundles(@PathVariable UUID userId) {
        // CRITICAL: Validate user belongs to current tenant
        tenantSecurityService.validateUserBelongsToTenant(userId);
        
        // CRITICAL: DTO mapping service'de yapılıyor (@Transactional context'i içinde)
        List<BundleDto> bundleDtos = permissionService.getUserBundlesAsDto(userId);
        
        return ResponseEntity.ok(ApiResponse.success(bundleDtos));
    }

    // ========== Request DTOs ==========

    public static class AssignPermissionRequest {
        private UUID permissionId;
        
        public UUID getPermissionId() {
            return permissionId;
        }
        
        public void setPermissionId(UUID permissionId) {
            this.permissionId = permissionId;
        }
    }
    
    public static class CreateBundleRequest {
        private String name;
        private String description;
        private List<UUID> permissionIds;
        
        public String getName() {
            return name;
        }
        
        public void setName(String name) {
            this.name = name;
        }
        
        public String getDescription() {
            return description;
        }
        
        public void setDescription(String description) {
            this.description = description;
        }
        
        public List<UUID> getPermissionIds() {
            return permissionIds;
        }
        
        public void setPermissionIds(List<UUID> permissionIds) {
            this.permissionIds = permissionIds;
        }
    }
    
    public static class UpdateBundleRequest {
        private List<UUID> permissionIds;
        
        public List<UUID> getPermissionIds() {
            return permissionIds;
        }
        
        public void setPermissionIds(List<UUID> permissionIds) {
            this.permissionIds = permissionIds;
        }
    }
}
