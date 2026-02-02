package com.terrarosa.terra_crm.modules.auth.service;

import com.terrarosa.terra_crm.core.audit.annotation.AuditLog;
import com.terrarosa.terra_crm.core.tenancy.entity.Tenant;
import com.terrarosa.terra_crm.core.tenancy.repository.TenantRepository;
import com.terrarosa.terra_crm.modules.auth.dto.BundleDto;
import com.terrarosa.terra_crm.modules.auth.dto.ModuleDTO;
import com.terrarosa.terra_crm.modules.auth.dto.PermissionResponseDTO;
import com.terrarosa.terra_crm.modules.auth.entity.Permission;
import com.terrarosa.terra_crm.modules.auth.entity.PermissionBundle;
import com.terrarosa.terra_crm.modules.auth.entity.TenantModule;
import com.terrarosa.terra_crm.modules.auth.entity.User;
import com.terrarosa.terra_crm.modules.auth.entity.UserPermission;
import com.terrarosa.terra_crm.modules.auth.repository.PermissionBundleRepository;
import com.terrarosa.terra_crm.modules.auth.repository.PermissionRepository;
import com.terrarosa.terra_crm.modules.auth.repository.RefreshTokenRepository;
import com.terrarosa.terra_crm.modules.auth.repository.TenantModuleRepository;
import com.terrarosa.terra_crm.modules.auth.repository.UserPermissionRepository;
import com.terrarosa.terra_crm.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * Get all permissions for a user.
     * Uses JOIN FETCH to prevent LazyInitializationException.
     */
    @Transactional(readOnly = true)
    public List<String> getUserPermissions(UUID userId) {
        List<UserPermission> userPermissions = userPermissionRepository.findByUserId(userId);
        log.debug("Found {} permissions for user {}", userPermissions.size(), userId);

        return userPermissions.stream()
                .map(up -> {
                    String permissionName = up.getPermission().getName();
                    log.debug("User {} has permission: {}", userId, permissionName);
                    return permissionName;
                })
                .collect(Collectors.toList());
    }

    /**
     * Validate that a permission can be assigned to a user from the tenant's module
     * pool.
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
                        String.format(
                                "Permission '%s' is not available for tenant. Module must be assigned to tenant first.",
                                permission.getName()));
            }
        } else if (permission.getType() == Permission.PermissionType.ACTION) {
            // For ACTION-level permissions, check if parent MODULE is in tenant_modules
            if (permission.getParentPermission() == null) {
                throw new IllegalStateException(
                        String.format("ACTION-level permission '%s' must have a parent MODULE permission.",
                                permission.getName()));
            }

            UUID parentModuleId = permission.getParentPermission().getId();
            boolean parentModuleExists = tenantModuleRepository.existsByTenantIdAndPermissionId(tenantId,
                    parentModuleId);
            if (!parentModuleExists) {
                throw new IllegalArgumentException(
                        String.format(
                                "Permission '%s' is not available for tenant. Parent module '%s' must be assigned to tenant first.",
                                permission.getName(), permission.getParentPermission().getName()));
            }
        }
    }

    /**
     * Assign a permission to a user with validation.
     * Validates that the permission is in the tenant's module pool before
     * assignment.
     */
    @AuditLog(action = "USER_PERMISSIONS_UPDATED", resourceType = "USER")
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
     * 
     * CRITICAL: This method reads from database. If called within the same transaction
     * where modules were just modified, ensure flush() is called before this method.
     */
    @Transactional(readOnly = true)
    public List<Permission> getTenantModules(UUID tenantId) {
        // CRITICAL: Flush any pending changes to ensure we read the latest module state
        // This is especially important when called right after setModulesForTenant
        tenantModuleRepository.flush();
        
        List<Permission> modules = tenantModuleRepository.findByTenantId(tenantId).stream()
                .map(TenantModule::getPermission)
                .filter(p -> p.getType() == Permission.PermissionType.MODULE)
                .collect(Collectors.toList());
        
        log.debug("Retrieved {} modules for tenant {}", modules.size(), tenantId);
        return modules;
    }

    /**
     * Get all MODULE-level permissions (modules) assigned to the current tenant as DTOs.
     * Includes child ACTION permissions to avoid circular reference issues during JSON serialization.
     * 
     * CRITICAL: DTO mapping happens within @Transactional(readOnly = true) context
     * to prevent LazyInitializationException when accessing module.getChildPermissions().
     * 
     * @param tenantId Tenant ID
     * @return List of ModuleDTO with child permissions always populated
     */
    @Transactional(readOnly = true)
    public List<ModuleDTO> getTenantModulesAsDto(UUID tenantId) {
        List<Permission> modules = getTenantModules(tenantId);
        
        return modules.stream()
                .map(module -> {
                    // Eager load child permissions (session açık)
                    Set<Permission> childPermissions = module.getChildPermissions();
                    List<PermissionResponseDTO> childDtos = childPermissions.stream()
                            .map(p -> PermissionResponseDTO.builder()
                                    .id(p.getId())
                                    .name(p.getName())
                                    .description(p.getDescription())
                                    .type(p.getType())
                                    .parentPermissionId(module.getId())
                                    .parentPermissionName(module.getName())
                                    .build())
                            .collect(Collectors.toList());
                    
                    return ModuleDTO.builder()
                            .id(module.getId())
                            .name(module.getName())
                            .description(module.getDescription())
                            .type(module.getType())
                            .childPermissions(childDtos)
                            .build();
                })
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
     * Get all MODULE-level permissions (available modules).
     * Used by Super Admin to see what modules can be assigned to tenants.
     */
    @Transactional(readOnly = true)
    public List<Permission> getAllModuleLevelPermissions() {
        return permissionRepository.findAll().stream()
                .filter(p -> p.getType() == Permission.PermissionType.MODULE)
                .collect(Collectors.toList());
    }

    /**
     * Get all ACTION-level permissions available for a tenant based on their assigned modules.
     * This method returns only ACTION permissions that belong to modules assigned to the tenant.
     * MODULE-level permissions are excluded.
     * 
     * CRITICAL: This ensures tenant admin can only see and assign permissions from their active modules.
     * 
     * @param tenantId Tenant ID
     * @return List of ACTION-level permissions available to the tenant
     */
    @Transactional(readOnly = true)
    public List<Permission> getTenantAvailablePermissions(UUID tenantId) {
        // Get all modules assigned to the tenant
        List<Permission> tenantModules = getTenantModules(tenantId);
        
        if (tenantModules.isEmpty()) {
            log.debug("No modules found for tenant {}. Returning empty permission list.", tenantId);
            return List.of();
        }
        
        // Collect all ACTION permissions from tenant's modules
        Set<Permission> availablePermissions = new java.util.HashSet<>();
        
        for (Permission module : tenantModules) {
            try {
                // Get all ACTION permissions for this module
                List<Permission> modulePermissions = getModulePermissions(module.getName());
                availablePermissions.addAll(modulePermissions);
                log.debug("Module {} has {} action permissions", module.getName(), modulePermissions.size());
            } catch (Exception e) {
                log.warn("Failed to get permissions for module {}: {}", module.getName(), e.getMessage());
            }
        }
        
        List<Permission> result = new java.util.ArrayList<>(availablePermissions);
        log.info("Retrieved {} available ACTION permissions for tenant {} from {} modules", 
                result.size(), tenantId, tenantModules.size());
        
        return result;
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
                        throw new IllegalArgumentException(
                                "Permission '" + moduleName + "' is not a MODULE-level permission");
                    }
                    return module;
                })
                .collect(Collectors.toList());

        // Filter out already assigned modules
        List<TenantModule> newTenantModules = modules.stream()
                .filter(module -> !tenantModuleRepository.existsByTenantIdAndPermissionId(tenant.getId(),
                        module.getId()))
                .map(module -> TenantModule.builder()
                        .tenant(tenant)
                        .permission(module)
                        .build())
                .collect(Collectors.toList());

        if (!newTenantModules.isEmpty()) {
            // CRITICAL: Use saveAll for batch operation - prevents Hibernate 7 TableGroup
            // issues
            tenantModuleRepository.saveAll(newTenantModules);
            // CRITICAL: Flush to ensure all TenantModule records are persisted before any
            // subsequent queries
            tenantModuleRepository.flush();
            log.info("Assigned {} modules to tenant {} in batch", newTenantModules.size(), tenant.getName());
        } else {
            log.warn("All modules already assigned to tenant {}", tenant.getName());
        }
    }

    /**
     * Clear all modules and assign new ones for a tenant.
     * Use this when you want to explicitly define the module set (e.g., in
     * SuperAdmin creation flow).
     * 
     * CRITICAL: When modules are removed, cascade removal of permissions from all users.
     */
    @Transactional
    public void setModulesForTenant(Tenant tenant, List<String> moduleNames) {
        if (tenant.getId() == null) {
            throw new IllegalStateException("Tenant must be persisted before setting modules");
        }

        UUID tenantId = tenant.getId();
        log.info("Setting modules for tenant {}: {}", tenant.getName(), moduleNames);

        // 1. Get current modules before clearing
        // CRITICAL: Flush first to ensure we read the latest state
        tenantModuleRepository.flush();
        List<Permission> currentModules = tenantModuleRepository.findByTenantId(tenantId).stream()
                .map(TenantModule::getPermission)
                .filter(p -> p.getType() == Permission.PermissionType.MODULE)
                .collect(Collectors.toList());
        Set<String> currentModuleNames = currentModules.stream()
                .map(Permission::getName)
                .collect(Collectors.toSet());
        
        log.debug("Current modules for tenant {}: {}", tenant.getName(), currentModuleNames);
        
        // 2. Determine which modules are being removed and which are being added
        Set<String> newModuleNames = new java.util.HashSet<>(moduleNames);
        Set<String> removedModuleNames = currentModuleNames.stream()
                .filter(moduleName -> !newModuleNames.contains(moduleName))
                .collect(Collectors.toSet());
        Set<String> addedModuleNames = newModuleNames.stream()
                .filter(moduleName -> !currentModuleNames.contains(moduleName))
                .collect(Collectors.toSet());
        
        log.debug("Module changes for tenant {}: removed={}, added={}", 
                tenant.getName(), removedModuleNames, addedModuleNames);

        // 3. CRITICAL: Remove permissions from all users for removed modules
        if (!removedModuleNames.isEmpty()) {
            log.info("Removing permissions for {} removed modules from all tenant users: {}", 
                    removedModuleNames.size(), removedModuleNames);
            
            // Get all users for this tenant
            List<User> tenantUsers = userRepository.findByTenantId(tenantId);
            
            for (String removedModuleName : removedModuleNames) {
                Permission removedModule = permissionRepository.findByName(removedModuleName)
                        .orElse(null);
                
                if (removedModule == null) {
                    log.warn("Removed module {} not found in permissions table", removedModuleName);
                    continue;
                }
                
                // Get all permissions for this module (MODULE + all ACTION permissions)
                List<Permission> modulePermissions = getModulePermissions(removedModuleName);
                Set<UUID> permissionIdsToRemove = modulePermissions.stream()
                        .map(Permission::getId)
                        .collect(Collectors.toSet());
                permissionIdsToRemove.add(removedModule.getId()); // Include the module itself
                
                // Remove permissions from all tenant users
                for (User user : tenantUsers) {
                    int removedCount = 0;
                    for (UUID permissionId : permissionIdsToRemove) {
                        if (userPermissionRepository.findByUserIdAndPermissionId(user.getId(), permissionId).isPresent()) {
                            userPermissionRepository.deleteByUserIdAndPermissionId(user.getId(), permissionId);
                            removedCount++;
                        }
                    }
                    if (removedCount > 0) {
                        log.info("Removed {} permissions from user {} due to module {} removal", 
                                removedCount, user.getEmail(), removedModuleName);
                        
                        // CRITICAL: Invalidate all refresh tokens for this user to force re-login with updated permissions
                        refreshTokenRepository.revokeAllUserTokens(user.getId(), java.time.LocalDateTime.now());
                        log.info("Revoked all refresh tokens for user {} to force re-login with updated permissions", user.getEmail());
                    }
                }
            }
            
            // Flush to ensure permissions are removed before clearing modules
            userPermissionRepository.flush();
        }

        // 4. Clear existing modules from tenant_modules
        tenantModuleRepository.deleteAllByTenantId(tenantId);
        // CRITICAL: Flush to ensure deletion is reflected in database before re-adding
        tenantModuleRepository.flush();

        // 5. Assign new modules
        assignModulesToTenant(tenant, moduleNames);
        
        // 6. CRITICAL: Assign permissions from newly added modules to all existing tenant users
        if (!addedModuleNames.isEmpty()) {
            log.info("Assigning permissions for {} newly added modules to all tenant users: {}", 
                    addedModuleNames.size(), addedModuleNames);
            
            // Get all users for this tenant
            List<User> tenantUsers = userRepository.findByTenantId(tenantId);
            
            for (String addedModuleName : addedModuleNames) {
                Permission addedModule = permissionRepository.findByName(addedModuleName)
                        .orElse(null);
                
                if (addedModule == null) {
                    log.warn("Added module {} not found in permissions table", addedModuleName);
                    continue;
                }
                
                // Get all permissions for this module (MODULE + all ACTION permissions)
                List<Permission> modulePermissions = getModulePermissions(addedModuleName);
                Set<UUID> permissionIdsToAdd = modulePermissions.stream()
                        .map(Permission::getId)
                        .collect(Collectors.toSet());
                permissionIdsToAdd.add(addedModule.getId()); // Include the module itself
                
                // Assign permissions to all tenant users
                for (User user : tenantUsers) {
                    int addedCount = 0;
                    List<UserPermission> permissionsToSave = new java.util.ArrayList<>();
                    
                    for (UUID permissionId : permissionIdsToAdd) {
                        // Check if already assigned
                        if (userPermissionRepository.findByUserIdAndPermissionId(user.getId(), permissionId).isEmpty()) {
                            Permission permission = permissionRepository.findById(permissionId)
                                    .orElse(null);
                            if (permission != null) {
                                permissionsToSave.add(UserPermission.builder()
                                        .user(user)
                                        .permission(permission)
                                        .build());
                                addedCount++;
                            }
                        }
                    }
                    
                    if (!permissionsToSave.isEmpty()) {
                        userPermissionRepository.saveAll(permissionsToSave);
                        log.info("Assigned {} permissions from module {} to user {}", 
                                addedCount, addedModuleName, user.getEmail());
                        
                        // CRITICAL: Invalidate all refresh tokens for this user to force re-login with updated permissions
                        refreshTokenRepository.revokeAllUserTokens(user.getId(), java.time.LocalDateTime.now());
                        log.info("Revoked all refresh tokens for user {} to force re-login with new permissions", user.getEmail());
                    }
                }
            }
            
            // Flush to ensure permissions are assigned
            userPermissionRepository.flush();
        }
        
        log.info("Successfully updated modules for tenant {}. Removed {} modules, added {} modules", 
                tenant.getName(), removedModuleNames.size(), addedModuleNames.size());
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
     * 
     * CRITICAL: This method ONLY assigns permissions from modules that are currently
     * assigned to the tenant. It does NOT remove existing permissions that don't
     * belong to tenant modules - use setModulesForTenant for that.
     */
    @Transactional
    public void assignAllTenantPermissionsToUser(User user) {
        UUID tenantId = user.getTenant().getId();
        UUID userId = user.getId();

        log.info("Starting permission assignment for user {} of tenant {}", user.getEmail(), tenantId);

        // CRITICAL: Ensure user is fully persisted before assigning permissions
        if (userId == null) {
            throw new IllegalStateException("User must be persisted before assigning permissions");
        }

        // CRITICAL: Flush to ensure tenant modules are persisted before reading
        tenantModuleRepository.flush();
        
        // Get all modules for the tenant
        List<Permission> tenantModules = tenantModuleRepository.findByTenantId(tenantId).stream()
                .map(TenantModule::getPermission)
                .filter(p -> p.getType() == Permission.PermissionType.MODULE)
                .collect(Collectors.toList());

        if (tenantModules.isEmpty()) {
            log.error("No modules found for tenant {}. Cannot assign permissions to user {}. " +
                    "This indicates modules were not properly assigned to the tenant during creation.",
                    tenantId, user.getEmail());
            return;
        }

        // CRITICAL: Log module names for debugging
        List<String> moduleNames = tenantModules.stream()
                .map(Permission::getName)
                .collect(Collectors.toList());
        log.info("Found {} modules for tenant {}. Assigning all permissions to user {} from modules: {}",
                tenantModules.size(), tenantId, user.getEmail(), moduleNames);

        // CRITICAL: Get all valid permission IDs that belong to tenant modules
        // This includes MODULE permissions and all ACTION permissions for each module
        Set<UUID> validPermissionIds = new java.util.HashSet<>();
        Set<String> validPermissionNames = new java.util.HashSet<>();
        for (Permission module : tenantModules) {
            validPermissionIds.add(module.getId()); // Add MODULE permission
            validPermissionNames.add(module.getName());
            
            // Add all ACTION permissions for this module
            try {
                List<Permission> modulePermissions = getModulePermissions(module.getName());
                for (Permission actionPermission : modulePermissions) {
                    validPermissionIds.add(actionPermission.getId());
                    validPermissionNames.add(actionPermission.getName());
                }
                log.debug("Module {} has {} action permissions", module.getName(), modulePermissions.size());
            } catch (Exception e) {
                log.warn("Failed to get permissions for module {}: {}", module.getName(), e.getMessage());
            }
        }
        
        log.info("Valid permission IDs for tenant modules: {} ({} permissions)", 
                validPermissionIds.size(), validPermissionNames);
        
        // CRITICAL: Remove ALL existing permissions first, then assign only tenant module permissions
        // This ensures user ONLY has permissions from currently assigned modules (clean slate approach)
        List<UserPermission> existingPermissions = userPermissionRepository.findByUserId(userId);
        int removedCount = 0;
        Set<String> removedPermissionNames = new java.util.HashSet<>();
        for (UserPermission existingPerm : existingPermissions) {
            UUID permissionId = existingPerm.getPermission().getId();
            String permissionName = existingPerm.getPermission().getName();
            if (!validPermissionIds.contains(permissionId)) {
                // This permission doesn't belong to any tenant module - remove it
                userPermissionRepository.deleteByUserIdAndPermissionId(userId, permissionId);
                removedCount++;
                removedPermissionNames.add(permissionName);
                log.debug("Removed invalid permission {} from user {} (not in tenant modules)", 
                        permissionName, user.getEmail());
            }
        }
        if (removedCount > 0) {
            log.info("Removed {} invalid permissions from user {} (not in tenant modules): {}", 
                    removedCount, user.getEmail(), removedPermissionNames);
            userPermissionRepository.flush();
        }

        int totalPermissionsAssigned = 0;
        List<UserPermission> permissionsToSave = new java.util.ArrayList<>();

        // For each module, assign the module itself and all its action-level
        // permissions
        for (Permission module : tenantModules) {
            try {
                // 1. Assign the MODULE permission itself
                if (userPermissionRepository.findByUserIdAndPermissionId(userId, module.getId()).isEmpty()) {
                    permissionsToSave.add(UserPermission.builder()
                            .user(user)
                            .permission(module)
                            .build());
                    totalPermissionsAssigned++;
                    log.debug("Prepared MODULE permission {} for user {}", module.getName(), user.getEmail());
                }

                // 2. Assign all ACTION-level permissions for this module
                List<Permission> modulePermissions = getModulePermissions(module.getName());
                log.debug("Module {} has {} action permissions", module.getName(), modulePermissions.size());

                for (Permission permission : modulePermissions) {
                    try {
                        // Check if already assigned
                        if (userPermissionRepository.findByUserIdAndPermissionId(userId, permission.getId())
                                .isPresent()) {
                            continue;
                        }

                        // Validate permission assignment
                        validatePermissionAssignment(tenantId, permission.getId());

                        // Create UserPermission
                        permissionsToSave.add(UserPermission.builder()
                                .user(user)
                                .permission(permission)
                                .build());
                        totalPermissionsAssigned++;

                        log.debug("Prepared permission {} for user {}", permission.getName(), user.getEmail());
                    } catch (Exception e) {
                        log.warn("Failed to prepare permission {} for user {}: {}",
                                permission.getName(), user.getEmail(), e.getMessage());
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to get permissions for module {}: {}", module.getName(), e.getMessage());
            }
        }

        // CRITICAL: Batch save all permissions and flush to ensure they're persisted
        if (!permissionsToSave.isEmpty()) {
            userPermissionRepository.saveAll(permissionsToSave);
            userPermissionRepository.flush(); // Ensure all permissions are persisted
            log.info("Successfully saved {} permissions to database for user {}",
                    permissionsToSave.size(), user.getEmail());
        }

        // Verify permissions were saved
        List<String> savedPermissions = getUserPermissions(userId);
        
        // CRITICAL: Log all assigned permissions for debugging
        List<String> modulePermissionNames = savedPermissions.stream()
                .filter(p -> p.startsWith("MODULE_"))
                .collect(Collectors.toList());
        log.info("Assigned {} permissions to first user {} of tenant {}. Verified {} permissions in database.",
                totalPermissionsAssigned, user.getEmail(), user.getTenant().getName(), savedPermissions.size());
        log.info("User {} has {} MODULE permissions: {}", user.getEmail(), modulePermissionNames.size(), modulePermissionNames);
        log.info("User {} has {} total permissions. MODULE permissions: {}", 
                user.getEmail(), savedPermissions.size(), modulePermissionNames);

        if (savedPermissions.isEmpty()) {
            log.error("CRITICAL: No permissions found in database after assignment for user {}. " +
                    "This indicates a serious issue with permission persistence.", user.getEmail());
        }
    }

    /**
     * Create a permission bundle for a tenant.
     * Validates that all permissions are from the tenant's module pool.
     */
    @AuditLog(action = "BUNDLE_CREATED", resourceType = "BUNDLE")
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
    @AuditLog(action = "BUNDLE_ASSIGNED", resourceType = "USER")
    @Transactional
    public void assignBundleToUser(UUID userId, UUID bundleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        PermissionBundle bundle = permissionBundleRepository.findByIdWithPermissions(bundleId)
                .orElseThrow(() -> new IllegalArgumentException("Bundle not found with id: " + bundleId));

        // Validate bundle belongs to user's tenant
        if (!bundle.getTenant().getId().equals(user.getTenant().getId())) {
            throw new IllegalArgumentException("Bundle does not belong to user's tenant");
        }

        // CRITICAL: User.bundles is mappedBy="users" so PermissionBundle owns the relationship.
        // We must update the owning side for user_bundles join table to be persisted.
        bundle.getUsers().add(user);
        permissionBundleRepository.save(bundle);
        // Keep inverse side in sync for in-memory consistency
        user.getBundles().add(bundle);

        // Copy all permissions from bundle to user_permissions (permissions loaded eagerly above)
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
     * CRITICAL: Removes bundle association AND removes all permissions from that bundle
     * from user_permissions table (cascade cleanup).
     *
     * This ensures that when a bundle is removed from a user, the user loses
     * all permissions that were granted through that bundle.
     */
    @AuditLog(action = "BUNDLE_REMOVED", resourceType = "USER")
    @Transactional
    public void removeBundleFromUser(UUID userId, UUID bundleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        PermissionBundle bundle = permissionBundleRepository.findById(bundleId)
                .orElseThrow(() -> new IllegalArgumentException("Bundle not found with id: " + bundleId));

        // CRITICAL: Remove all permissions from bundle from user_permissions table
        Set<UUID> bundlePermissionIds = bundle.getPermissions().stream()
                .map(Permission::getId)
                .collect(Collectors.toSet());
        
        int removedCount = 0;
        for (UUID permissionId : bundlePermissionIds) {
            if (userPermissionRepository.findByUserIdAndPermissionId(userId, permissionId).isPresent()) {
                userPermissionRepository.deleteByUserIdAndPermissionId(userId, permissionId);
                removedCount++;
            }
        }
        
        // CRITICAL: PermissionBundle owns the relationship; update owning side so user_bundles is updated
        bundle.getUsers().remove(user);
        permissionBundleRepository.save(bundle);
        user.getBundles().remove(bundle);

        log.info("Removed bundle '{}' from user {}. Removed {} permissions from user_permissions table",
                bundle.getName(), user.getEmail(), removedCount);
    }

    /**
     * Delete a bundle with cascade cleanup.
     * CRITICAL: When a bundle is deleted, all permissions from that bundle are removed
     * from all users who had the bundle assigned.
     * 
     * Steps:
     * 1. Find all users who have this bundle assigned
     * 2. For each user, remove all bundle permissions from user_permissions table
     * 3. Remove bundle-user associations (user_bundles table - JPA Many-to-Many handles this)
     * 4. Bundle-permission associations are removed automatically (DB cascade)
     * 5. Soft delete the bundle
     *
     * @param bundleId Bundle ID to delete
     */
    @AuditLog(action = "BUNDLE_DELETED", resourceType = "BUNDLE")
    @Transactional
    public void deleteBundle(UUID bundleId) {
        PermissionBundle bundle = permissionBundleRepository.findById(bundleId)
                .orElseThrow(() -> new IllegalArgumentException("Bundle not found with id: " + bundleId));

        String bundleName = bundle.getName();
        
        // Get all users who have this bundle assigned
        List<User> usersWithBundle = bundle.getUsers().stream()
                .collect(Collectors.toList());
        
        log.info("Deleting bundle '{}' (id: {}). Found {} users with this bundle assigned.",
                bundleName, bundleId, usersWithBundle.size());
        
        // Get all permission IDs from bundle
        Set<UUID> bundlePermissionIds = bundle.getPermissions().stream()
                .map(Permission::getId)
                .collect(Collectors.toSet());
        
        // For each user, remove bundle permissions from user_permissions table
        int totalPermissionsRemoved = 0;
        for (User user : usersWithBundle) {
            int userPermissionsRemoved = 0;
            for (UUID permissionId : bundlePermissionIds) {
                if (userPermissionRepository.findByUserIdAndPermissionId(user.getId(), permissionId).isPresent()) {
                    userPermissionRepository.deleteByUserIdAndPermissionId(user.getId(), permissionId);
                    userPermissionsRemoved++;
                    totalPermissionsRemoved++;
                }
            }
            
            if (userPermissionsRemoved > 0) {
                log.info("Removed {} permissions from user {} (email: {}) due to bundle deletion",
                        userPermissionsRemoved, user.getId(), user.getEmail());
            }
        }
        
        // Remove bundle-user associations (JPA Many-to-Many will handle user_bundles table)
        // We need to clear the relationship from both sides
        for (User user : usersWithBundle) {
            user.getBundles().remove(bundle);
        }
        userRepository.saveAll(usersWithBundle);
        
        // Bundle-permission associations will be removed automatically by DB cascade
        // (bundle_permissions table has ON DELETE CASCADE)
        
        // Soft delete the bundle
        bundle.setDeleted(true);
        bundle.setDeletedAt(java.time.LocalDateTime.now());
        permissionBundleRepository.save(bundle);
        
        log.info("Successfully deleted bundle '{}' (id: {}). Removed {} permissions from {} users.",
                bundleName, bundleId, totalPermissionsRemoved, usersWithBundle.size());
    }

    /**
     * Update bundle permissions.
     * Validates all new permissions are in tenant's module pool.
     */
    @AuditLog(action = "BUNDLE_UPDATED", resourceType = "BUNDLE")
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
     * Get a single bundle by ID as DTO (validates tenant).
     * Use this instead of returning PermissionBundle entity to avoid Jackson recursion (Permission parent/child).
     */
    @Transactional(readOnly = true)
    public BundleDto getBundleByIdAsDto(UUID tenantId, UUID bundleId) {
        PermissionBundle bundle = permissionBundleRepository.findByIdWithPermissions(bundleId)
                .filter(b -> b.getTenant().getId().equals(tenantId))
                .orElseThrow(() -> new IllegalArgumentException("Bundle not found with id: " + bundleId));
        return toBundleDto(bundle);
    }

    /** Map entity to DTO within transactional context (permissions and tenant loaded). */
    private BundleDto toBundleDto(PermissionBundle bundle) {
        Set<Permission> permissions = bundle.getPermissions();
        List<PermissionResponseDTO> permissionDtos = permissions.stream()
                .map(p -> PermissionResponseDTO.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .description(p.getDescription())
                        .type(p.getType())
                        .parentPermissionId(p.getParentPermission() != null ? p.getParentPermission().getId() : null)
                        .parentPermissionName(p.getParentPermission() != null ? p.getParentPermission().getName() : null)
                        .build())
                .collect(Collectors.toList());
        return BundleDto.builder()
                .id(bundle.getId())
                .name(bundle.getName())
                .description(bundle.getDescription())
                .tenantId(bundle.getTenant().getId())
                .permissions(permissionDtos)
                .createdAt(bundle.getCreatedAt())
                .updatedAt(bundle.getUpdatedAt())
                .build();
    }

    /**
     * Get all bundles for a tenant as DTOs with eagerly-loaded permissions.
     * 
     * CRITICAL: DTO mapping happens within @Transactional(readOnly = true) context
     * to prevent LazyInitializationException when accessing bundle.getPermissions().
     * 
     * @param tenantId Tenant ID
     * @return List of BundleDto with permissions always populated
     */
    @Transactional(readOnly = true)
    public List<BundleDto> getTenantBundlesAsDto(UUID tenantId) {
        List<PermissionBundle> bundles = getTenantBundles(tenantId);
        return bundles.stream().map(this::toBundleDto).collect(Collectors.toList());
    }

    /**
     * Get all bundles assigned to a user.
     * 
     * @param userId User ID
     * @return List of PermissionBundle entities
     */
    @Transactional(readOnly = true)
    public List<PermissionBundle> getUserBundles(UUID userId) {
        return permissionBundleRepository.findByUserId(userId);
    }

    /**
     * Get all bundles assigned to a user as DTOs with eagerly-loaded permissions.
     * 
     * CRITICAL: DTO mapping happens within @Transactional(readOnly = true) context
     * to prevent LazyInitializationException when accessing bundle.getPermissions().
     * 
     * @param userId User ID
     * @return List of BundleDto with permissions always populated
     */
    @Transactional(readOnly = true)
    public List<BundleDto> getUserBundlesAsDto(UUID userId) {
        List<PermissionBundle> bundles = getUserBundles(userId);
        return bundles.stream().map(this::toBundleDto).collect(Collectors.toList());
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
