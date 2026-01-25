package com.terrarosa.terra_crm.modules.auth.controller;

import com.terrarosa.terra_crm.core.common.dto.ApiResponse;
import com.terrarosa.terra_crm.modules.auth.entity.Permission;
import com.terrarosa.terra_crm.modules.auth.entity.PermissionBundle;
import com.terrarosa.terra_crm.modules.auth.service.PermissionService;
import com.terrarosa.terra_crm.modules.auth.service.SuperAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller for managing permissions, tenant modules, and user permissions.
 * Most endpoints require ROLE_ADMIN.
 * Module assignment endpoints require Super Admin privileges.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/permissions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ROLE_ADMIN')")
public class PermissionController {
    
    private final PermissionService permissionService;
    private final SuperAdminService superAdminService;
    
    /**
     * Get all available permissions.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Permission>>> getAllPermissions() {
        List<Permission> permissions = permissionService.getAllPermissions();
        return ResponseEntity.ok(ApiResponse.success(permissions));
    }
    
    /**
     * Get modules assigned to a tenant.
     */
    @GetMapping("/tenants/{tenantId}/modules")
    public ResponseEntity<ApiResponse<List<Permission>>> getTenantModules(@PathVariable UUID tenantId) {
        List<Permission> modules = permissionService.getTenantModules(tenantId);
        return ResponseEntity.ok(ApiResponse.success(modules));
    }
    
    /**
     * Assign a module to a tenant.
     * CRITICAL: Only Super Admin can assign modules to tenants.
     */
    @PostMapping("/tenants/{tenantId}/modules")
    public ResponseEntity<ApiResponse<Void>> assignModuleToTenant(
            @PathVariable UUID tenantId,
            @RequestBody AssignModuleRequest request) {
        // Check if current user is super admin
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        UUID userId = permissionService.getUserIdByEmail(email);
        
        if (!superAdminService.isSuperAdmin(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("FORBIDDEN", "Only Super Admin can assign modules to tenants"));
        }
        
        permissionService.assignModuleToTenant(tenantId, request.getModuleName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(null, "Module assigned successfully"));
    }
    
    /**
     * Remove a module from a tenant.
     * CRITICAL: Only Super Admin can remove modules from tenants.
     * This triggers cascade invalidation - removes permissions from all tenant bundles.
     */
    @DeleteMapping("/tenants/{tenantId}/modules/{moduleName}")
    public ResponseEntity<ApiResponse<Void>> removeModuleFromTenant(
            @PathVariable UUID tenantId,
            @PathVariable String moduleName) {
        // Check if current user is super admin
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        UUID userId = permissionService.getUserIdByEmail(email);
        
        if (!superAdminService.isSuperAdmin(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("FORBIDDEN", "Only Super Admin can remove modules from tenants"));
        }
        
        permissionService.removeModuleFromTenant(tenantId, moduleName);
        return ResponseEntity.ok(ApiResponse.success(null, "Module removed successfully. Related bundle permissions invalidated."));
    }
    
    /**
     * Get permissions for a user.
     */
    @GetMapping("/users/{userId}/permissions")
    public ResponseEntity<ApiResponse<List<String>>> getUserPermissions(@PathVariable UUID userId) {
        List<String> permissions = permissionService.getUserPermissions(userId);
        return ResponseEntity.ok(ApiResponse.success(permissions));
    }
    
    /**
     * Assign a permission to a user.
     * Validates that the permission is in the tenant's module pool.
     */
    @PostMapping("/users/{userId}/permissions")
    public ResponseEntity<ApiResponse<Void>> assignPermissionToUser(
            @PathVariable UUID userId,
            @RequestBody AssignPermissionRequest request) {
        permissionService.assignPermissionToUser(userId, request.getPermissionId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(null, "Permission assigned successfully"));
    }
    
    /**
     * Remove a permission from a user.
     */
    @DeleteMapping("/users/{userId}/permissions/{permissionId}")
    public ResponseEntity<ApiResponse<Void>> removePermissionFromUser(
            @PathVariable UUID userId,
            @PathVariable UUID permissionId) {
        permissionService.removePermissionFromUser(userId, permissionId);
        return ResponseEntity.ok(ApiResponse.success(null, "Permission removed successfully"));
    }
    
    /**
     * Get all action-level permissions for a module.
     */
    @GetMapping("/modules/{moduleName}/permissions")
    public ResponseEntity<ApiResponse<List<Permission>>> getModulePermissions(@PathVariable String moduleName) {
        List<Permission> permissions = permissionService.getModulePermissions(moduleName);
        return ResponseEntity.ok(ApiResponse.success(permissions));
    }
    
    /**
     * Create a permission bundle.
     */
    @PostMapping("/bundles")
    public ResponseEntity<ApiResponse<PermissionBundle>> createBundle(@RequestBody CreateBundleRequest request) {
        PermissionBundle bundle = permissionService.createBundle(
            request.getTenantId(),
            request.getName(),
            request.getDescription(),
            request.getPermissionIds()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(bundle, "Bundle created successfully"));
    }
    
    /**
     * Get all bundles for a tenant.
     */
    @GetMapping("/bundles/tenants/{tenantId}")
    public ResponseEntity<ApiResponse<List<PermissionBundle>>> getTenantBundles(@PathVariable UUID tenantId) {
        List<PermissionBundle> bundles = permissionService.getTenantBundles(tenantId);
        return ResponseEntity.ok(ApiResponse.success(bundles));
    }
    
    /**
     * Update a bundle.
     */
    @PutMapping("/bundles/{bundleId}")
    public ResponseEntity<ApiResponse<PermissionBundle>> updateBundle(
            @PathVariable UUID bundleId,
            @RequestBody UpdateBundleRequest request) {
        PermissionBundle bundle = permissionService.updateBundle(bundleId, request.getPermissionIds());
        return ResponseEntity.ok(ApiResponse.success(bundle, "Bundle updated successfully"));
    }
    
    /**
     * Assign a bundle to a user.
     */
    @PostMapping("/bundles/{bundleId}/assign/{userId}")
    public ResponseEntity<ApiResponse<Void>> assignBundleToUser(
            @PathVariable UUID bundleId,
            @PathVariable UUID userId) {
        permissionService.assignBundleToUser(userId, bundleId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(null, "Bundle assigned successfully. Permissions copied to user."));
    }
    
    /**
     * Remove a bundle from a user.
     */
    @DeleteMapping("/bundles/{bundleId}/users/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeBundleFromUser(
            @PathVariable UUID bundleId,
            @PathVariable UUID userId) {
        permissionService.removeBundleFromUser(userId, bundleId);
        return ResponseEntity.ok(ApiResponse.success(null, "Bundle removed successfully"));
    }
    
    // DTOs for request bodies
    public static class AssignModuleRequest {
        private String moduleName;
        
        public String getModuleName() {
            return moduleName;
        }
        
        public void setModuleName(String moduleName) {
            this.moduleName = moduleName;
        }
    }
    
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
        private UUID tenantId;
        private String name;
        private String description;
        private List<UUID> permissionIds;
        
        public UUID getTenantId() {
            return tenantId;
        }
        
        public void setTenantId(UUID tenantId) {
            this.tenantId = tenantId;
        }
        
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
