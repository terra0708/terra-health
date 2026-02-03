package com.terrarosa.terra_crm.core.config;

import com.terrarosa.terra_crm.core.tenancy.entity.Tenant;
import com.terrarosa.terra_crm.core.tenancy.repository.TenantRepository;
import com.terrarosa.terra_crm.core.tenancy.service.TenantService;
import com.terrarosa.terra_crm.modules.auth.entity.SuperAdmin;
import com.terrarosa.terra_crm.modules.auth.entity.User;
import com.terrarosa.terra_crm.modules.auth.repository.PermissionRepository;
import com.terrarosa.terra_crm.modules.auth.repository.RoleRepository;
import com.terrarosa.terra_crm.modules.auth.repository.SuperAdminRepository;
import com.terrarosa.terra_crm.modules.auth.repository.UserRepository;
import com.terrarosa.terra_crm.modules.auth.service.PermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.DependsOn;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

/**
 * Initializes seed data after V23 migration:
 * - Super Admin user (if not exists)
 * - Demo Tenant with admin user
 * - Default module assignments
 * 
 * CRITICAL: This runs AFTER migrations (V23) and SuperAdminInitializer (Order
 * 100).
 * Uses @Value to read configuration from application.yaml (no hardcoding).
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Order(101) // Run after SuperAdminInitializer (Order 100)
@DependsOn("flyway") // CRITICAL: Wait for Flyway migrations to complete
public class PermissionSeedDataInitializer implements CommandLineRunner {

    // Super Admin Configuration (from application.yaml)
    @Value("${app.seed.superadmin.email:admin@terra.com}")
    private String superAdminEmail;

    @Value("${app.seed.superadmin.password:SuperAdmin123!}")
    private String superAdminPassword;

    // Demo Tenant Configuration (from application.yaml)
    @Value("${app.seed.demo.tenant.name:Demo Tenant}")
    private String demoTenantName;

    @Value("${app.seed.demo.tenant.domain:demo}")
    private String demoTenantDomain;

    @Value("${app.seed.demo.admin.email:admin@demo.com}")
    private String demoAdminEmail;

    @Value("${app.seed.demo.admin.password:Admin123!}")
    private String demoAdminPassword;

    private final TenantService tenantService;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SuperAdminRepository superAdminRepository;
    private final PasswordEncoder passwordEncoder;
    private final PermissionRepository permissionRepository;
    private final PermissionService permissionService;

    @Override
    public void run(String... args) {
        try {
            log.info("Starting Permission Seed Data Initialization...");

            // Step 1: Ensure Super Admin exists (SuperAdminInitializer may have already
            // created it)
            ensureSuperAdminExists();

            // Step 2: Create Demo Tenant and Admin (if not exists)
            ensureDemoTenantAndAdminExists();

            log.info("Permission Seed Data Initialization completed successfully");

        } catch (Exception e) {
            log.error("Failed to initialize seed data", e);
            // Don't throw - allow application to start even if initialization fails
            // Seed data can be created manually later
        }
    }

    /**
     * Ensure Super Admin user exists with correct permissions.
     * If SuperAdminInitializer already created it, this will just verify
     * permissions.
     */
    @Transactional
    private void ensureSuperAdminExists() {
        try {
            var systemTenant = tenantService.getSystemTenant();
            var superAdminRole = roleRepository.findByName("ROLE_SUPER_ADMIN")
                    .orElseThrow(() -> new IllegalStateException(
                            "ROLE_SUPER_ADMIN not found. Ensure migration V8 has run."));

            var existingUser = userRepository.findByEmail(superAdminEmail);

            if (existingUser.isPresent()) {
                User user = existingUser.get();

                if (superAdminRepository.existsByUserId(user.getId())) {
                    log.info("Super Admin user already exists: {}", superAdminEmail);
                    // Permissions are already assigned by SuperAdminInitializer
                    return;
                } else {
                    // User exists but is not Super Admin - grant privileges
                    log.warn("User {} exists but is not Super Admin. Granting privileges...", superAdminEmail);
                    superAdminRepository.save(SuperAdmin.builder().user(user).build());
                    assignSuperAdminPermissions(user);
                    return;
                }
            }

            // Create Super Admin user
            log.info("Creating Super Admin user: {}", superAdminEmail);

            String encodedPassword = passwordEncoder.encode(superAdminPassword);

            User superAdminUser = User.builder()
                    .email(superAdminEmail)
                    .password(encodedPassword)
                    .firstName("Super")
                    .lastName("Admin")
                    .tenant(systemTenant)
                    .enabled(true)
                    .build();

            superAdminUser.getRoles().add(superAdminRole);

            User savedUser = userRepository.save(superAdminUser);

            SuperAdmin superAdmin = SuperAdmin.builder()
                    .user(savedUser)
                    .build();

            superAdminRepository.save(superAdmin);

            assignSuperAdminPermissions(savedUser);

            log.info("Super Admin user created successfully: {}", superAdminEmail);
            log.warn("IMPORTANT: Change the default Super Admin password in production!");

        } catch (Exception e) {
            log.error("Failed to ensure Super Admin exists", e);
            throw e;
        }
    }

    /**
     * Assign Super Admin specific permissions.
     */
    @Transactional
    private void assignSuperAdminPermissions(User superAdminUser) {
        List<String> superAdminPermissionNames = Arrays.asList(
                "MODULE_DASHBOARD",
                "DASHBOARD_VIEW",
                "MODULE_SUPERADMIN",
                "SUPERADMIN_TENANTS_VIEW",
                "SUPERADMIN_TENANTS_MANAGE",
                "SUPERADMIN_USER_SEARCH_VIEW",
                "SUPERADMIN_SCHEMAPOOL_VIEW",
                "SUPERADMIN_SCHEMAPOOL_MANAGE",
                "SUPERADMIN_AUDIT_VIEW");

        log.info("Assigning Super Admin permissions to user: {}", superAdminUser.getEmail());

        for (String permissionName : superAdminPermissionNames) {
            permissionRepository.findByName(permissionName).ifPresent(permission -> {
                permissionService.assignPermissionToUser(superAdminUser.getId(), permission.getId());
            });
        }
    }

    /**
     * Ensure Demo Tenant and Admin exist.
     * Creates demo tenant with specific modules and an admin user.
     */
    @Transactional
    private void ensureDemoTenantAndAdminExists() {
        try {
            // Check if demo tenant already exists (by domain)
            // Note: TenantRepository doesn't have findByDomain, so we use findAll and
            // filter
            var existingTenant = tenantRepository.findAll().stream()
                    .filter(t -> demoTenantDomain.equals(t.getDomain()))
                    .findFirst();

            if (existingTenant.isPresent()) {
                log.info("Demo Tenant already exists: {}", demoTenantDomain);
                // Ensure admin user exists
                ensureDemoAdminExists(existingTenant.get());
                return;
            }

            // Create demo tenant
            log.info("Creating Demo Tenant: {} (domain: {})", demoTenantName, demoTenantDomain);

            Tenant demoTenant = tenantService.createTenant(demoTenantName);
            demoTenant.setDomain(demoTenantDomain);
            demoTenant = tenantRepository.save(demoTenant);

            // Assign specific modules to demo tenant
            // MODULE_DASHBOARD, MODULE_APPOINTMENTS, MODULE_CUSTOMERS, MODULE_MARKETING
            // (only MARKETING_DASHBOARD action)
            List<String> demoModules = Arrays.asList(
                    "MODULE_DASHBOARD",
                    "MODULE_APPOINTMENTS",
                    "MODULE_CUSTOMERS",
                    "MODULE_MARKETING");

            permissionService.setModulesForTenant(demoTenant, demoModules);
            log.info("Assigned {} modules to Demo Tenant", demoModules.size());

            // Create demo admin user
            ensureDemoAdminExists(demoTenant);

            log.info("Demo Tenant and Admin created successfully");

        } catch (Exception e) {
            log.error("Failed to ensure Demo Tenant and Admin exist", e);
            throw e;
        }
    }

    /**
     * Ensure Demo Admin user exists for the given tenant.
     */
    @Transactional
    private void ensureDemoAdminExists(Tenant tenant) {
        try {
            var existingAdmin = userRepository.findByEmail(demoAdminEmail);

            if (existingAdmin.isPresent()) {
                log.info("Demo Admin user already exists: {}. Re-assigning permissions to ensure consistency.",
                        demoAdminEmail);
                permissionService.assignAllTenantPermissionsToUser(existingAdmin.get());
                return;
            }

            // Create demo admin user
            log.info("Creating Demo Admin user: {} for tenant: {}", demoAdminEmail, tenant.getName());

            var adminRole = roleRepository.findByName("ROLE_ADMIN")
                    .orElseThrow(() -> new IllegalStateException(
                            "ROLE_ADMIN not found. Ensure migration V8 has run."));

            String encodedPassword = passwordEncoder.encode(demoAdminPassword);

            User adminUser = User.builder()
                    .email(demoAdminEmail)
                    .password(encodedPassword)
                    .firstName("Demo")
                    .lastName("Admin")
                    .tenant(tenant)
                    .enabled(true)
                    .build();

            adminUser.getRoles().add(adminRole);

            User savedAdmin = userRepository.save(adminUser);

            // Assign all tenant permissions to admin user
            permissionService.assignAllTenantPermissionsToUser(savedAdmin);

            log.info("Demo Admin user created successfully: {}", demoAdminEmail);
            log.warn("IMPORTANT: Change the default Demo Admin password in production!");

        } catch (Exception e) {
            log.error("Failed to ensure Demo Admin exists", e);
            throw e;
        }
    }
}
