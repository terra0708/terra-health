package com.terrarosa.terra_crm.core.config;

import com.terrarosa.terra_crm.core.tenancy.service.TenantService;
import com.terrarosa.terra_crm.modules.auth.entity.Role;
import com.terrarosa.terra_crm.modules.auth.entity.SuperAdmin;
import com.terrarosa.terra_crm.modules.auth.entity.User;
import com.terrarosa.terra_crm.modules.auth.repository.RoleRepository;
import com.terrarosa.terra_crm.modules.auth.repository.SuperAdminRepository;
import com.terrarosa.terra_crm.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Initializes the first Super Admin user on application startup.
 * 
 * CRITICAL: This runs AFTER migrations (V8 and V9) have created ROLE_SUPER_ADMIN and SYSTEM tenant.
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
public class SuperAdminInitializer implements CommandLineRunner {
    
    private static final String DEFAULT_SUPER_ADMIN_EMAIL = "admin@terra.com";
    private static final String DEFAULT_SUPER_ADMIN_PASSWORD = "SuperAdmin123!"; // Change in production!
    
    private final TenantService tenantService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SuperAdminRepository superAdminRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Override
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
                    return;
                } else {
                    // User exists but is not Super Admin - grant privileges
                    log.warn("User {} exists but is not Super Admin. Granting privileges...", DEFAULT_SUPER_ADMIN_EMAIL);
                    superAdminRepository.save(SuperAdmin.builder()
                            .user(user)
                            .build());
                    log.info("Granted Super Admin privileges to existing user: {}", DEFAULT_SUPER_ADMIN_EMAIL);
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
            // CRITICAL: Set user before saving to ensure relationship is properly established
            SuperAdmin superAdmin = SuperAdmin.builder()
                    .user(savedUser)
                    .build();
            
            superAdminRepository.save(superAdmin);
            log.info("Initial Super Admin created successfully: {}", DEFAULT_SUPER_ADMIN_EMAIL);
            log.warn("IMPORTANT: Change the default Super Admin password in production!");
            
        } catch (Exception e) {
            log.error("Failed to initialize Super Admin user", e);
            // Don't throw - allow application to start even if initialization fails
            // Admin can be created manually later
        }
    }
}
