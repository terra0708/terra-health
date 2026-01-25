package com.terrarosa.terra_crm.modules.auth.service;

import com.terrarosa.terra_crm.core.tenancy.entity.Tenant;
import com.terrarosa.terra_crm.core.tenancy.repository.TenantRepository;
import com.terrarosa.terra_crm.modules.auth.entity.Permission;
import com.terrarosa.terra_crm.modules.auth.entity.PermissionBundle;
import com.terrarosa.terra_crm.modules.auth.entity.TenantModule;
import com.terrarosa.terra_crm.modules.auth.entity.User;
import com.terrarosa.terra_crm.modules.auth.entity.UserPermission;
import com.terrarosa.terra_crm.modules.auth.repository.PermissionBundleRepository;
import com.terrarosa.terra_crm.modules.auth.repository.PermissionRepository;
import com.terrarosa.terra_crm.modules.auth.repository.TenantModuleRepository;
import com.terrarosa.terra_crm.modules.auth.repository.UserPermissionRepository;
import com.terrarosa.terra_crm.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing permissions, tenant modules, and user permissions.
 * Includes critical validation logic to ensure permissions are only assigned
 * from the tenant's module pool.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PermissionService {
    
    private final PermissionRepository permissionRepository;
    private final TenantModuleRepository tenantModuleRepository;
    private final UserPermissionRepository userPermissionRepository;
    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PermissionBundleRepository permissionBundleRepository;
    
    /**
     * Get all permissions for a user.
     */
    @Transactional(readOnly = true)
    public List<String> getUserPermissions(UUID userId) {
        return userPermissionRepository.findByUserId(userId).stream()
                .map(up -> up.getPermission().getName())
                .collect(Collectors.toList());
    }
    
    /**
     * Validate that a permission can be assigned to a user from the tenant's module pool.
     * 
     * CRITICAL VALIDATION LOGIC:
     * 1. Check if permission exists
     * 2. If ACTION-level, check if parent MODULE is in tenant_modules
     * 3. If MODULE-level, check if it's directly in tenant_modules
     * 4. Throw exception if validation fails
     */
    @Transactional(readOnly = true)
    public void validatePermissionAssignment(UUID tenantId, UUID permissionId) {
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new IllegalArgumentException("Permission not found with id: " + permissionId));
        
        if (permission.getType() == Permission.PermissionType.MODULE) {
            // For MODULE-level permissions, check if it's directly in tenant_modules
            boolean exists = tenantModuleRepository.existsByTenantIdAndPermissionId(tenantId, permissionId);
            if (!exists) {
                throw new IllegalArgumentException(
                    String.format("Permission '%s' is not available for tenant. Module must be assigned to tenant first.", permission.getName())
                );
            }
        } else if (permission.getType() == Permission.PermissionType.ACTION) {
            // For ACTION-level permissions, check if parent MODULE is in tenant_modules
            if (permission.getParentPermission() == null) {
                throw new IllegalStateException(
                    String.format("ACTION-level permission '%s' must have a parent MODULE permission.", permission.getName())
                );
            }
            
            UUID parentModuleId = permission.getParentPermission().getId();
            boolean parentModuleExists = tenantModuleRepository.existsByTenantIdAndPermissionId(tenantId, parentModuleId);
            if (!parentModuleExists) {
                throw new IllegalArgumentException(
                    String.format("Permission '%s' is not available for tenant. Parent module '%s' must be assigned to tenant first.", 
                        permission.getName(), permission.getParentPermission().getName())
                );
            }
        }
    }
    
    /**
     * Assign a permission to a user with validation.
     * Validates that the permission is in the tenant's module pool before assignment.
     */
    @Transactional
    public void assignPermissionToUser(UUID userId, UUID permissionId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        
        UUID tenantId = user.getTenant().getId();
        
        // Validate permission assignment
        validatePermissionAssignment(tenantId, permissionId);
        
        // Check if already assigned
        if (userPermissionRepository.findByUserIdAndPermissionId(userId, permissionId).isPresent()) {
            log.warn("Permission {} already assigned to user {}", permissionId, userId);
            return;
        }
        
        // Get permission
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new IllegalArgumentException("Permission not found with id: " + permissionId));
        
        // Create and save UserPermission
        UserPermission userPermission = UserPermission.builder()
                .user(user)
                .permission(permission)
                .build();
        
        userPermissionRepository.save(userPermission);
        log.info("Assigned permission {} to user {}", permission.getName(), user.getEmail());
    }
    
    /**
     * Assign a permission to a user (with User entity provided).
     */
    @Transactional
    public void assignPermissionToUser(User user, UUID permissionId) {
        UUID tenantId = user.getTenant().getId();
        
        // Validate permission assignment
        validatePermissionAssignment(tenantId, permissionId);
        
        // Check if already assigned
        if (userPermissionRepository.findByUserIdAndPermissionId(user.getId(), permissionId).isPresent()) {
            log.warn("Permission {} already assigned to user {}", permissionId, user.getId());
            return;
        }
        
        // Get permission
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new IllegalArgumentException("Permission not found with id: " + permissionId));
        
        // Create and save UserPermission
        UserPermission userPermission = UserPermission.builder()
                .user(user)
                .permission(permission)
                .build();
        
        userPermissionRepository.save(userPermission);
        log.info("Assigned permission {} to user {}", permission.getName(), user.getEmail());
    }
    
    /**
     * Remove a permission from a user.
     */
    @Transactional
    public void removePermissionFromUser(UUID userId, UUID permissionId) {
        userPermissionRepository.deleteByUserIdAndPermissionId(userId, permissionId);
        log.info("Removed permission {} from user {}", permissionId, userId);
    }
    
    /**
     * Get all modules available to a tenant.
     */
    @Transactional(readOnly = true)
    public List<Permission> getTenantModules(UUID tenantId) {
        return tenantModuleRepository.findByTenantId(tenantId).stream()
                .map(TenantModule::getPermission)
                .filter(p -> p.getType() == Permission.PermissionType.MODULE)
                .collect(Collectors.toList());
    }
    
    /**
     * Get all action-level permissions for a module.
     */
    @Transactional(readOnly = true)
    public List<Permission> getModulePermissions(String moduleName) {
        Permission module = permissionRepository.findByName(moduleName)
                .orElseThrow(() -> new IllegalArgumentException("Module not found: " + moduleName));
        
        if (module.getType() != Permission.PermissionType.MODULE) {
            throw new IllegalArgumentException("Permission '" + moduleName + "' is not a MODULE-level permission");
        }
        
        return permissionRepository.findByParentPermission(module);
    }
    
    /**
     * Get all available permissions.
     */
    @Transactional(readOnly = true)
    public List<Permission> getAllPermissions() {
        return permissionRepository.findAll();
    }
    
    /**
     * Assign a module to a tenant.
     */
    @Transactional
    public void assignModuleToTenant(UUID tenantId, String moduleName) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found with id: " + tenantId));
        
        Permission module = permissionRepository.findByName(moduleName)
                .orElseThrow(() -> new IllegalArgumentException("Module not found: " + moduleName));
        
        if (module.getType() != Permission.PermissionType.MODULE) {
            throw new IllegalArgumentException("Permission '" + moduleName + "' is not a MODULE-level permission");
        }
        
        // Check if already assigned
        if (tenantModuleRepository.existsByTenantIdAndPermissionId(tenantId, module.getId())) {
            log.warn("Module {} already assigned to tenant {}", moduleName, tenantId);
            return;
        }
        
        // Create and save TenantModule
        TenantModule tenantModule = TenantModule.builder()
                .tenant(tenant)
                .permission(module)
                .build();
        
        tenantModuleRepository.save(tenantModule);
        log.info("Assigned module {} to tenant {}", moduleName, tenant.getName());
    }
    
    /**
     * Assign a module to a tenant (with Tenant entity provided).
     */
    @Transactional
    public void assignModuleToTenant(Tenant tenant, String moduleName) {
        Permission module = permissionRepository.findByName(moduleName)
                .orElseThrow(() -> new IllegalArgumentException("Module not found: " + moduleName));
        
        if (module.getType() != Permission.PermissionType.MODULE) {
            throw new IllegalArgumentException("Permission '" + moduleName + "' is not a MODULE-level permission");
        }
        
        // Check if already assigned
        if (tenantModuleRepository.existsByTenantIdAndPermissionId(tenant.getId(), module.getId())) {
            log.warn("Module {} already assigned to tenant {}", moduleName, tenant.getId());
            return;
        }
        
        // CRITICAL: Ensure tenant and permission entities are fully persisted
        // This prevents Hibernate 7 TableGroup.getModelPart() errors with @IdClass
        if (tenant.getId() == null) {
            throw new IllegalStateException("Tenant must be persisted before assigning modules");
        }
        if (module.getId() == null) {
            throw new IllegalStateException("Permission must be persisted before assigning modules");
        }
        
        // Create and save TenantModule
        TenantModule tenantModule = TenantModule.builder()
                .tenant(tenant)
                .permission(module)
                .build();
        
        tenantModuleRepository.save(tenantModule);
        log.info("Assigned module {} to tenant {}", moduleName, tenant.getName());
    }
    
    /**
     * Assign multiple modules to a tenant in a single batch operation.
     * This is more efficient and prevents Hibernate 7 TableGroup issues.
     */
    @Transactional
    public void assignModulesToTenant(Tenant tenant, List<String> moduleNames) {
        if (tenant.getId() == null) {
            throw new IllegalStateException("Tenant must be persisted before assigning modules");
        }
        
        // Get all modules
        List<Permission> modules = moduleNames.stream()
                .map(moduleName -> {
                    Permission module = permissionRepository.findByName(moduleName)
                            .orElseThrow(() -> new IllegalArgumentException("Module not found: " + moduleName));
                    if (module.getType() != Permission.PermissionType.MODULE) {
                        throw new IllegalArgumentException("Permission '" + moduleName + "' is not a MODULE-level permission");
                    }
                    return module;
                })
                .collect(Collectors.toList());
        
        // Filter out already assigned modules
        List<TenantModule> newTenantModules = modules.stream()
                .filter(module -> !tenantModuleRepository.existsByTenantIdAndPermissionId(tenant.getId(), module.getId()))
                .map(module -> TenantModule.builder()
                        .tenant(tenant)
                        .permission(module)
                        .build())
                .collect(Collectors.toList());
        
        if (!newTenantModules.isEmpty()) {
            // CRITICAL: Use saveAll for batch operation - prevents Hibernate 7 TableGroup issues
            tenantModuleRepository.saveAll(newTenantModules);
            log.info("Assigned {} modules to tenant {} in batch", newTenantModules.size(), tenant.getName());
        } else {
            log.warn("All modules already assigned to tenant {}", tenant.getName());
        }
    }
    
    /**
     * Remove a module from a tenant.
     * CRITICAL: Cascade invalidation - removes all permissions from that module
     * from all bundles belonging to the tenant.
     */
    @Transactional
    public void removeModuleFromTenant(UUID tenantId, String moduleName) {
        Permission module = permissionRepository.findByName(moduleName)
                .orElseThrow(() -> new IllegalArgumentException("Module not found: " + moduleName));
        
        if (module.getType() != Permission.PermissionType.MODULE) {
            throw new IllegalArgumentException("Permission '" + moduleName + "' is not a MODULE-level permission");
        }
        
        // Get all action permissions for this module
        List<Permission> modulePermissions = getModulePermissions(moduleName);
        Set<UUID> permissionIdsToRemove = modulePermissions.stream()
                .map(Permission::getId)
                .collect(Collectors.toSet());
        permissionIdsToRemove.add(module.getId()); // Include the module itself
        
        // CRITICAL: Cascade invalidation - remove permissions from all tenant bundles
        List<PermissionBundle> tenantBundles = permissionBundleRepository.findByTenantId(tenantId);
        for (PermissionBundle bundle : tenantBundles) {
            Set<Permission> permissionsToRemove = bundle.getPermissions().stream()
                    .filter(p -> permissionIdsToRemove.contains(p.getId()))
                    .collect(Collectors.toSet());
            
            if (!permissionsToRemove.isEmpty()) {
                bundle.getPermissions().removeAll(permissionsToRemove);
                permissionBundleRepository.save(bundle);
                log.info("Removed {} permissions from bundle {} due to module removal", 
                    permissionsToRemove.size(), bundle.getName());
            }
        }
        
        // Remove module from tenant_modules
        tenantModuleRepository.deleteByTenantIdAndPermissionId(tenantId, module.getId());
        log.info("Removed module {} from tenant {} and invalidated related bundle permissions", 
            moduleName, tenantId);
    }
    
    /**
     * Assign all permissions from tenant's module pool to a user.
     * Used for initial admin assignment (first user of a tenant).
     */
    @Transactional
    public void assignAllTenantPermissionsToUser(User user) {
        UUID tenantId = user.getTenant().getId();
        
        // Get all modules for the tenant
        List<Permission> tenantModules = getTenantModules(tenantId);
        
        if (tenantModules.isEmpty()) {
            log.warn("No modules found for tenant {}. Cannot assign permissions to user {}.", 
                tenantId, user.getEmail());
            return;
        }
        
        log.debug("Found {} modules for tenant {}. Assigning all permissions to user {}", 
            tenantModules.size(), tenantId, user.getEmail());
        
        int totalPermissionsAssigned = 0;
        
        // For each module, get all action-level permissions and assign them
        for (Permission module : tenantModules) {
            try {
                List<Permission> modulePermissions = getModulePermissions(module.getName());
                log.debug("Module {} has {} action permissions", module.getName(), modulePermissions.size());
                
                for (Permission permission : modulePermissions) {
                    try {
                        assignPermissionToUser(user, permission.getId());
                        totalPermissionsAssigned++;
                    } catch (Exception e) {
                        log.warn("Failed to assign permission {} to user {}: {}", 
                            permission.getName(), user.getEmail(), e.getMessage());
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to get permissions for module {}: {}", module.getName(), e.getMessage());
            }
        }
        
        log.info("Assigned {} permissions to first user {} of tenant {}", 
            totalPermissionsAssigned, user.getEmail(), user.getTenant().getName());
    }
    
    /**
     * Create a permission bundle for a tenant.
     * Validates that all permissions are from the tenant's module pool.
     */
    @Transactional
    public PermissionBundle createBundle(UUID tenantId, String name, String description, List<UUID> permissionIds) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found with id: " + tenantId));
        
        // Check if bundle with same name already exists for this tenant
        if (permissionBundleRepository.findByNameAndTenantId(name, tenantId).isPresent()) {
            throw new IllegalArgumentException("Bundle with name '" + name + "' already exists for this tenant");
        }
        
        // Validate all permissions are in tenant's module pool
        for (UUID permissionId : permissionIds) {
            validatePermissionAssignment(tenantId, permissionId);
        }
        
        // Get permission entities
        Set<Permission> permissions = permissionIds.stream()
                .map(id -> permissionRepository.findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("Permission not found with id: " + id)))
                .collect(Collectors.toSet());
        
        // Create bundle
        PermissionBundle bundle = PermissionBundle.builder()
                .name(name)
                .description(description)
                .tenant(tenant)
                .permissions(permissions)
                .build();
        
        PermissionBundle savedBundle = permissionBundleRepository.save(bundle);
        log.info("Created permission bundle '{}' for tenant {} with {} permissions", 
            name, tenant.getName(), permissions.size());
        
        return savedBundle;
    }
    
    /**
     * Assign a bundle to a user.
     * Copies all permissions from the bundle to user_permissions table.
     */
    @Transactional
    public void assignBundleToUser(UUID userId, UUID bundleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        
        PermissionBundle bundle = permissionBundleRepository.findById(bundleId)
                .orElseThrow(() -> new IllegalArgumentException("Bundle not found with id: " + bundleId));
        
        // Validate bundle belongs to user's tenant
        if (!bundle.getTenant().getId().equals(user.getTenant().getId())) {
            throw new IllegalArgumentException("Bundle does not belong to user's tenant");
        }
        
        // Add bundle to user's bundles (for tracking)
        user.getBundles().add(bundle);
        userRepository.save(user);
        
        // Copy all permissions from bundle to user_permissions
        int permissionsAssigned = 0;
        for (Permission permission : bundle.getPermissions()) {
            try {
                assignPermissionToUser(user, permission.getId());
                permissionsAssigned++;
            } catch (Exception e) {
                log.warn("Failed to assign permission {} from bundle {} to user {}: {}", 
                    permission.getName(), bundle.getName(), user.getEmail(), e.getMessage());
            }
        }
        
        log.info("Assigned bundle '{}' to user {}. {} permissions copied to user_permissions", 
            bundle.getName(), user.getEmail(), permissionsAssigned);
    }
    
    /**
     * Remove a bundle from a user.
     * Removes the bundle association but does NOT remove individual permissions
     * (they may have been assigned separately).
     */
    @Transactional
    public void removeBundleFromUser(UUID userId, UUID bundleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        
        PermissionBundle bundle = permissionBundleRepository.findById(bundleId)
                .orElseThrow(() -> new IllegalArgumentException("Bundle not found with id: " + bundleId));
        
        user.getBundles().remove(bundle);
        userRepository.save(user);
        
        log.info("Removed bundle '{}' from user {}", bundle.getName(), user.getEmail());
    }
    
    /**
     * Update bundle permissions.
     * Validates all new permissions are in tenant's module pool.
     */
    @Transactional
    public PermissionBundle updateBundle(UUID bundleId, List<UUID> permissionIds) {
        PermissionBundle bundle = permissionBundleRepository.findById(bundleId)
                .orElseThrow(() -> new IllegalArgumentException("Bundle not found with id: " + bundleId));
        
        UUID tenantId = bundle.getTenant().getId();
        
        // Validate all permissions are in tenant's module pool
        for (UUID permissionId : permissionIds) {
            validatePermissionAssignment(tenantId, permissionId);
        }
        
        // Get permission entities
        Set<Permission> permissions = permissionIds.stream()
                .map(id -> permissionRepository.findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("Permission not found with id: " + id)))
                .collect(Collectors.toSet());
        
        bundle.setPermissions(permissions);
        PermissionBundle updatedBundle = permissionBundleRepository.save(bundle);
        
        log.info("Updated bundle '{}' with {} permissions", bundle.getName(), permissions.size());
        
        return updatedBundle;
    }
    
    /**
     * Get all bundles for a tenant.
     */
    @Transactional(readOnly = true)
    public List<PermissionBundle> getTenantBundles(UUID tenantId) {
        return permissionBundleRepository.findByTenantId(tenantId);
    }
    
    /**
     * Get user ID by email (helper for security checks).
     */
    @Transactional(readOnly = true)
    public UUID getUserIdByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
        return user.getId();
    }
}
