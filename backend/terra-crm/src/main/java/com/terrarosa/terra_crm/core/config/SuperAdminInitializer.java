package com.terrarosa.terra_crm.core.config;

import com.terrarosa.terra_crm.core.tenancy.service.TenantService;
import com.terrarosa.terra_crm.modules.auth.entity.Permission;
import com.terrarosa.terra_crm.modules.auth.entity.SuperAdmin;
import com.terrarosa.terra_crm.modules.auth.entity.User;
import com.terrarosa.terra_crm.modules.auth.entity.UserPermission;
import com.terrarosa.terra_crm.modules.auth.repository.PermissionRepository;
import com.terrarosa.terra_crm.modules.auth.repository.RoleRepository;
import com.terrarosa.terra_crm.modules.auth.repository.SuperAdminRepository;
import com.terrarosa.terra_crm.modules.auth.repository.UserPermissionRepository;
import com.terrarosa.terra_crm.modules.auth.repository.UserRepository;
import com.terrarosa.terra_crm.modules.auth.service.PermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.DependsOn;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Initializes the first Super Admin user on application startup.
 * 
 * CRITICAL: This runs AFTER migrations (V8 and V9) have created
 * ROLE_SUPER_ADMIN and SYSTEM tenant.
 * 
 * Creates a Super Admin user with:
 * - Email: admin@terra.com (configurable via application.yaml)
 * - Password: BCrypt encoded
 * - Tenant: SYSTEM tenant
 * - Role: ROLE_SUPER_ADMIN
 * 
 * This user is stored in public.users table (not in tenant schema).
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Order(100) // Run after migrations (which typically run at order 1-10)
@DependsOn("flyway") // CRITICAL: Wait for Flyway migrations to complete before initializing
public class SuperAdminInitializer implements CommandLineRunner {

    private static final String DEFAULT_SUPER_ADMIN_EMAIL = "admin@terra.com";
    private static final String DEFAULT_SUPER_ADMIN_PASSWORD = "SuperAdmin123!"; // Change in production!

    private final TenantService tenantService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SuperAdminRepository superAdminRepository;
    private final PasswordEncoder passwordEncoder;
    private final PermissionRepository permissionRepository;
    private final UserPermissionRepository userPermissionRepository;
    private final PermissionService permissionService;

    @Override
    @Transactional
    public void run(String... args) {
        try {
            // Check if SYSTEM tenant exists
            var systemTenant = tenantService.getSystemTenant();
            log.debug("SYSTEM tenant found: id={}", systemTenant.getId());

            // Check if ROLE_SUPER_ADMIN exists
            var superAdminRole = roleRepository.findByName("ROLE_SUPER_ADMIN")
                    .orElseThrow(() -> new IllegalStateException(
                            "ROLE_SUPER_ADMIN not found. Ensure migration V8 has run."));
            log.debug("ROLE_SUPER_ADMIN role found: id={}", superAdminRole.getId());

            // Check if Super Admin user already exists
            var existingUser = userRepository.findByEmail(DEFAULT_SUPER_ADMIN_EMAIL);
            if (existingUser.isPresent()) {
                User user = existingUser.get();

                // Check if user is already a Super Admin
                if (superAdminRepository.existsByUserId(user.getId())) {
                    log.info("Super Admin user already exists: {}", DEFAULT_SUPER_ADMIN_EMAIL);
                    // CRITICAL: Ensure Super Admin has only Super Admin specific permissions
                    // This will clean up any extra permissions that were assigned before
                    assignSuperAdminPermissions(user);
                    return;
                } else {
                    // User exists but is not Super Admin - grant privileges
                    log.warn("User {} exists but is not Super Admin. Granting privileges...",
                            DEFAULT_SUPER_ADMIN_EMAIL);
                    superAdminRepository.save(SuperAdmin.builder()
                            .user(user)
                            .build());
                    log.info("Granted Super Admin privileges to existing user: {}", DEFAULT_SUPER_ADMIN_EMAIL);
                    // Assign Super Admin specific permissions
                    assignSuperAdminPermissions(user);
                    return;
                }
            }

            // Create Super Admin user
            log.info("Creating initial Super Admin user: {}", DEFAULT_SUPER_ADMIN_EMAIL);

            String encodedPassword = passwordEncoder.encode(DEFAULT_SUPER_ADMIN_PASSWORD);

            User superAdminUser = User.builder()
                    .email(DEFAULT_SUPER_ADMIN_EMAIL)
                    .password(encodedPassword)
                    .firstName("Super")
                    .lastName("Admin")
                    .tenant(systemTenant)
                    .enabled(true)
                    .build();

            // Assign ROLE_SUPER_ADMIN
            superAdminUser.getRoles().add(superAdminRole);

            User savedUser = userRepository.save(superAdminUser);
            log.info("Created Super Admin user: id={}, email={}", savedUser.getId(), savedUser.getEmail());

            // Create SuperAdmin entity
            // CRITICAL: Set user before saving to ensure relationship is properly
            // established
            SuperAdmin superAdmin = SuperAdmin.builder()
                    .user(savedUser)
                    .build();

            superAdminRepository.save(superAdmin);
            log.info("Initial Super Admin created successfully: {}", DEFAULT_SUPER_ADMIN_EMAIL);

            // CRITICAL: Assign only Super Admin specific permissions
            assignSuperAdminPermissions(savedUser);

            log.warn("IMPORTANT: Change the default Super Admin password in production!");

        } catch (Exception e) {
            log.error("Failed to initialize Super Admin user", e);
            // Don't throw - allow application to start even if initialization fails
            // Admin can be created manually later
        }
    }

    /**
     * Assign only Super Admin specific permissions to Super Admin user.
     * Super Admin should only have:
     * - Dashboard permissions (MODULE_DASHBOARD, DASHBOARD_VIEW)
     * - Super Admin module permissions (MODULE_SUPERADMIN, SUPERADMIN_*)
     * 
     * NOTE: PermissionEvaluator has Super Admin bypass, so Super Admin can access
     * any endpoint regardless of permissions. But for consistency and proper
     * JWT token generation, we assign only Super Admin specific permissions.
     * 
     * @param superAdminUser The Super Admin user to assign permissions to
     */
    @Transactional
    private void assignSuperAdminPermissions(User superAdminUser) {
        try {
            UUID userId = superAdminUser.getId();
            var systemTenant = superAdminUser.getTenant();

            // CRITICAL: Ensure SYSTEM tenant has the required modules assigned
            // PermissionService.assignPermissionToUser validates against tenant_modules
            List<String> requiredModules = List.of("MODULE_DASHBOARD", "MODULE_SUPERADMIN");
            log.info("Ensuring SYSTEM tenant has modules assigned: {}", requiredModules);
            permissionService.assignModulesToTenant(systemTenant, requiredModules);

            // Define Super Admin specific permission names
            List<String> superAdminPermissionNames = List.of(
                    // Dashboard permissions
                    "MODULE_DASHBOARD",
                    "DASHBOARD_VIEW",
                    // Super Admin module permissions
                    "MODULE_SUPERADMIN",
                    "SUPERADMIN_TENANTS_VIEW",
                    "SUPERADMIN_TENANTS_MANAGE",
                    "SUPERADMIN_USER_SEARCH_VIEW",
                    "SUPERADMIN_SCHEMAPOOL_VIEW",
                    "SUPERADMIN_SCHEMAPOOL_MANAGE",
                    "SUPERADMIN_AUDIT_VIEW");

            log.info("Assigning Super Admin specific permissions to user: {}", superAdminUser.getEmail());

            int assignedCount = 0;
            int skippedCount = 0;
            int notFoundCount = 0;

            for (String permissionName : superAdminPermissionNames) {
                // Find permission by name
                var permissionOpt = permissionRepository.findByName(permissionName);

                if (permissionOpt.isEmpty()) {
                    log.warn("Permission not found: {}. Skipping...", permissionName);
                    notFoundCount++;
                    continue;
                }

                Permission permission = permissionOpt.get();

                // Check if already assigned
                if (userPermissionRepository.findByUserIdAndPermissionId(userId, permission.getId()).isPresent()) {
                    skippedCount++;
                    continue;
                }

                // Create UserPermission
                UserPermission userPermission = UserPermission.builder()
                        .user(superAdminUser)
                        .permission(permission)
                        .build();

                userPermissionRepository.save(userPermission);
                assignedCount++;
                log.debug("Assigned permission: {}", permissionName);
            }

            log.info(
                    "Super Admin permission assignment completed: {} assigned, {} already existed, {} not found, {} total expected",
                    assignedCount, skippedCount, notFoundCount, superAdminPermissionNames.size());

            // Verify permissions were assigned
            List<UserPermission> userPermissions = userPermissionRepository.findByUserId(userId);
            log.info("Verified: Super Admin user {} now has {} permissions",
                    superAdminUser.getEmail(), userPermissions.size());

            if (userPermissions.isEmpty()) {
                log.error("CRITICAL: No permissions found after assignment for Super Admin user. " +
                        "This indicates a serious issue with permission persistence.");
            }

        } catch (Exception e) {
            log.error("Failed to assign Super Admin permissions: {}", e.getMessage(), e);
            // Don't throw - allow application to start even if permission assignment fails
            // Permissions can be assigned manually later
        }
    }
}
