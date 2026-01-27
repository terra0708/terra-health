package com.terrarosa.terra_crm.modules.auth.service;

import com.terrarosa.terra_crm.core.audit.annotation.AuditLog;
import com.terrarosa.terra_crm.core.security.service.JwtService;
import com.terrarosa.terra_crm.core.tenancy.entity.Tenant;
import com.terrarosa.terra_crm.core.tenancy.entity.TenantStatus;
import com.terrarosa.terra_crm.core.tenancy.repository.TenantRepository;
import com.terrarosa.terra_crm.core.tenancy.service.TenantService;
import com.terrarosa.terra_crm.modules.auth.dto.CreateTenantRequest;
import com.terrarosa.terra_crm.modules.auth.dto.TenantAdminDto;
import com.terrarosa.terra_crm.modules.auth.dto.TenantDto;
import com.terrarosa.terra_crm.modules.auth.entity.Role;
import com.terrarosa.terra_crm.modules.auth.entity.SuperAdmin;
import com.terrarosa.terra_crm.modules.auth.entity.User;
import com.terrarosa.terra_crm.modules.auth.repository.RefreshTokenRepository;
import com.terrarosa.terra_crm.modules.auth.repository.RoleRepository;
import com.terrarosa.terra_crm.modules.auth.repository.SuperAdminRepository;
import com.terrarosa.terra_crm.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing super admin users.
 * Super admins can assign modules to any tenant.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SuperAdminService {

        private final SuperAdminRepository superAdminRepository;
        private final UserRepository userRepository;
        private final TenantRepository tenantRepository;
        private final TenantService tenantService;
        private final PermissionService permissionService;
        private final RoleRepository roleRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtService jwtService;
        private final RefreshTokenRepository refreshTokenRepository;

        /**
         * Check if a user is a super admin.
         */
        @Transactional(readOnly = true)
        public boolean isSuperAdmin(UUID userId) {
                return superAdminRepository.existsByUserId(userId);
        }

        /**
         * Grant super admin privileges to a user.
         */
        @Transactional
        public void grantSuperAdmin(UUID userId) {
                if (superAdminRepository.existsByUserId(userId)) {
                        log.warn("User {} is already a super admin", userId);
                        return;
                }

                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

                SuperAdmin superAdmin = SuperAdmin.builder()
                                .user(user)
                                .build();

                superAdminRepository.save(superAdmin);
                log.info("Granted super admin privileges to user: {}", user.getEmail());
        }

        /**
         * Revoke super admin privileges from a user.
         */
        @Transactional
        public void revokeSuperAdmin(UUID userId) {
                if (!superAdminRepository.existsByUserId(userId)) {
                        log.warn("User {} is not a super admin", userId);
                        return;
                }

                superAdminRepository.deleteByUserId(userId);
                log.info("Revoked super admin privileges from user: {}", userId);
        }

        /**
         * Create a new tenant with admin user and assigned modules in a single atomic
         * operation.
         * 
         * CRITICAL: This method performs the following steps atomically:
         * 1. Validates email uniqueness (before transaction)
         * 2. Creates tenant and schema (TenantService.createTenant)
         * 3. Assigns modules to tenant
         * 4. Creates admin user in public.users table
         * 5. Assigns ROLE_ADMIN role
         * 6. Assigns all ACTION permissions from selected modules
         * 
         * All operations run in public schema except tenant schema creation (which is
         * outside transaction).
         * 
         * @param request Tenant creation request with admin details and module names
         * @return TenantDto and TenantAdminDto containing created tenant and admin
         *         information
         */
        @Transactional
        public TenantAdminCreationResult createTenantWithAdminAndModules(CreateTenantRequest request) {
                // CRITICAL: Normalize domain to ensure consistency
                // Remove leading/trailing whitespace, convert to lowercase, remove spaces
                String normalizedDomain = request.getDomain() != null 
                        ? request.getDomain().toLowerCase().trim().replaceAll("\\s+", "")
                        : null;
                
                if (normalizedDomain == null || normalizedDomain.isBlank()) {
                        throw new IllegalArgumentException("Domain is required and cannot be blank");
                }
                
                // CRITICAL: Normalize email to ensure consistency
                String adminEmail = request.getAdminEmail().toLowerCase().trim();

                // CRITICAL: Email uniqueness check BEFORE transaction (read-only)
                // This prevents deadlocks and improves performance
                if (userRepository.findByEmail(adminEmail).isPresent()) {
                        throw new IllegalArgumentException("Email already exists: " + adminEmail);
                }

                // Domain check - use normalized domain
                if (!adminEmail.endsWith("@" + normalizedDomain)) {
                        throw new IllegalArgumentException("Admin email must end with @" + normalizedDomain);
                }

                log.info("Creating tenant '{}' with admin user '{}' and {} modules",
                                request.getTenantName(), adminEmail, request.getModuleNames().size());

                // Step A: Create tenant (this includes schema creation via Flyway, outside
                // transaction)
                Tenant tenant = tenantService.createTenant(request.getTenantName());
                tenant.setDomain(normalizedDomain);
                if (request.getMaxUsers() != null) {
                        tenant.setMaxUsers(request.getMaxUsers());
                }
                tenant = tenantRepository.save(tenant);

                log.info("Created tenant: id={}, name={}, schemaName={}, domain={}",
                                tenant.getId(), tenant.getName(), tenant.getSchemaName(), tenant.getDomain());

                // Step B: Assign modules to tenant (overrides default core modules)
                // CRITICAL: setModulesForTenant clears any default modules added by
                // createTenant and removes permissions from users for removed modules
                permissionService.setModulesForTenant(tenant, request.getModuleNames());
                log.info("Set {} modules for tenant {}", request.getModuleNames().size(), tenant.getName());
                
                // CRITICAL: Ensure tenant modules are flushed and visible before assigning permissions
                // This prevents assignAllTenantPermissionsToUser from reading stale module data
                // Note: setModulesForTenant already flushes, but we ensure it here for clarity

                // Step C: Create admin user in public.users table
                String encodedPassword = passwordEncoder.encode(request.getAdminPassword());
                User adminUser = User.builder()
                                .email(adminEmail)
                                .password(encodedPassword)
                                .firstName(request.getAdminFirstName())
                                .lastName(request.getAdminLastName())
                                .tenant(tenant)
                                .enabled(true)
                                .build();

                // Step D: Assign ROLE_ADMIN role
                Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                                .orElseThrow(() -> new IllegalStateException("ROLE_ADMIN not found. Run migrations."));
                adminUser.getRoles().add(adminRole);

                User savedAdminUser = userRepository.save(adminUser);
                log.info("Created admin user: id={}, email={}, tenantId={}",
                                savedAdminUser.getId(), savedAdminUser.getEmail(), tenant.getId());

                // Step E: Assign all ACTION permissions from selected modules to admin user
                permissionService.assignAllTenantPermissionsToUser(savedAdminUser);
                log.info("Assigned all module permissions to admin user {}", savedAdminUser.getEmail());

                // CRITICAL: Invalidate all refresh tokens for this user to force re-login with new permissions
                // This ensures JWT token will contain updated permissions
                refreshTokenRepository.revokeAllUserTokens(savedAdminUser.getId(), java.time.LocalDateTime.now());
                log.info("Revoked all refresh tokens for admin user {} to force re-login with new permissions", savedAdminUser.getEmail());

                // Build response DTOs
                TenantDto tenantDto = TenantDto.builder()
                                .id(tenant.getId())
                                .name(tenant.getName())
                                .schemaName(tenant.getSchemaName())
                                .domain(tenant.getDomain())
                                .maxUsers(tenant.getMaxUsers())
                                .status(tenant.getStatus())
                                .quotaLimits(tenant.getQuotaLimits())
                                .assignedModules(request.getModuleNames())
                                .createdAt(tenant.getCreatedAt())
                                .updatedAt(tenant.getUpdatedAt())
                                .build();

                List<String> roles = savedAdminUser.getRoles().stream()
                                .map(Role::getName)
                                .collect(Collectors.toList());

                TenantAdminDto adminDto = TenantAdminDto.builder()
                                .id(savedAdminUser.getId())
                                .email(savedAdminUser.getEmail())
                                .firstName(savedAdminUser.getFirstName())
                                .lastName(savedAdminUser.getLastName())
                                .tenantId(tenant.getId())
                                .roles(roles)
                                .build();

                return new TenantAdminCreationResult(tenantDto, adminDto);
        }

        /**
         * Result class for tenant and admin creation.
         */
        public static class TenantAdminCreationResult {
                private final TenantDto tenant;
                private final TenantAdminDto admin;

                public TenantAdminCreationResult(TenantDto tenant, TenantAdminDto admin) {
                        this.tenant = tenant;
                        this.admin = admin;
                }

                public TenantDto getTenant() {
                        return tenant;
                }

                public TenantAdminDto getAdmin() {
                        return admin;
                }
        }

        // ========== Tenant Management Methods ==========

        /**
         * Suspend a tenant (set status to SUSPENDED).
         * SUSPENDED tenants cannot accept requests (rejected at interceptor level).
         */
        @AuditLog(action = "TENANT_SUSPENDED", resourceType = "TENANT")
        @Transactional
        public void suspendTenant(UUID tenantId, String reason) {
                Tenant tenant = tenantRepository.findById(tenantId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Tenant not found with id: " + tenantId));

                tenant.setStatus(TenantStatus.SUSPENDED);
                tenantRepository.save(tenant);
                log.info("Suspended tenant: {} (reason: {})", tenant.getName(), reason);
        }

        /**
         * Activate a tenant (set status to ACTIVE).
         */
        @AuditLog(action = "TENANT_ACTIVATED", resourceType = "TENANT")
        @Transactional
        public void activateTenant(UUID tenantId) {
                Tenant tenant = tenantRepository.findById(tenantId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Tenant not found with id: " + tenantId));

                tenant.setStatus(TenantStatus.ACTIVE);
                tenantRepository.save(tenant);
                log.info("Activated tenant: {}", tenant.getName());
        }

        /**
         * Hard delete a tenant (physical deletion from database).
         * WARNING: This permanently removes the tenant and all its data.
         */
        @AuditLog(action = "TENANT_DELETED", resourceType = "TENANT")
        @Transactional
        public void hardDeleteTenant(UUID tenantId) {
                Tenant tenant = tenantRepository.findById(tenantId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Tenant not found with id: " + tenantId));

                tenantRepository.hardDeleteById(tenantId);
                log.warn("Hard deleted tenant: {} (id: {})", tenant.getName(), tenantId);
        }

        /**
         * Update tenant details (name, domain, maxUsers).
         */
        @AuditLog(action = "TENANT_UPDATED", resourceType = "TENANT")
        @Transactional
        public TenantDto updateTenant(UUID tenantId, String name, String domain, Integer maxUsers) {
                Tenant tenant = tenantRepository.findById(tenantId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Tenant not found with id: " + tenantId));

                if (name != null)
                        tenant.setName(name);
                if (domain != null) {
                        // CRITICAL: Normalize domain to ensure consistency
                        String normalizedDomain = domain.toLowerCase().trim().replaceAll("\\s+", "");
                        if (normalizedDomain.isBlank()) {
                                throw new IllegalArgumentException("Domain cannot be blank");
                        }
                        tenant.setDomain(normalizedDomain);
                }
                if (maxUsers != null)
                        tenant.setMaxUsers(maxUsers);

                Tenant updatedTenant = tenantRepository.save(tenant);
                List<String> modules = getTenantModules(updatedTenant.getId());

                return TenantDto.builder()
                                .id(updatedTenant.getId())
                                .name(updatedTenant.getName())
                                .schemaName(updatedTenant.getSchemaName())
                                .domain(updatedTenant.getDomain())
                                .maxUsers(updatedTenant.getMaxUsers())
                                .status(updatedTenant.getStatus())
                                .quotaLimits(updatedTenant.getQuotaLimits())
                                .assignedModules(modules)
                                .createdAt(updatedTenant.getCreatedAt())
                                .updatedAt(updatedTenant.getUpdatedAt())
                                .build();
        }

        /**
         * Toggle a module for a tenant (feature flag).
         */
        @AuditLog(action = "MODULE_TOGGLED", resourceType = "TENANT")
        @Transactional
        public void toggleModuleForTenant(UUID tenantId, String moduleName, boolean enabled) {
                Tenant tenant = tenantRepository.findById(tenantId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Tenant not found with id: " + tenantId));

                // PermissionService handles module assignment/removal
                if (enabled) {
                        permissionService.assignModulesToTenant(tenant, List.of(moduleName));
                        log.info("Enabled module '{}' for tenant: {}", moduleName, tenant.getName());
                } else {
                        permissionService.removeModuleFromTenant(tenantId, moduleName);
                        log.info("Disabled module '{}' for tenant: {}", moduleName, tenant.getName());
                }
        }

        /**
         * Get assigned modules for a tenant.
         */
        @Transactional(readOnly = true)
        public List<String> getTenantModules(UUID tenantId) {
                Tenant tenant = tenantRepository.findById(tenantId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Tenant not found with id: " + tenantId));

                return permissionService.getTenantModules(tenant.getId()).stream()
                                .map(permission -> permission.getName())
                                .collect(Collectors.toList());
        }

        /**
         * Set modules for a tenant (replaces all existing modules).
         * This clears all existing modules and assigns the new ones.
         * 
         * CRITICAL: System Tenant can only have MODULE_SUPERADMIN module.
         * 
         * @param tenantId The tenant ID
         * @param moduleNames List of module names to assign
         */
        @AuditLog(action = "MODULES_SET", resourceType = "TENANT")
        @Transactional
        public void setModulesForTenant(UUID tenantId, List<String> moduleNames) {
                Tenant tenant = tenantRepository.findById(tenantId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Tenant not found with id: " + tenantId));

                // CRITICAL: System Tenant validation - Defense in Depth
                boolean isSystemTenant = "public".equals(tenant.getSchemaName()) && "SYSTEM".equals(tenant.getName());
                if (isSystemTenant) {
                        // System Tenant can only have MODULE_SUPERADMIN
                        if (moduleNames.size() > 1 || (moduleNames.size() == 1 && !moduleNames.contains("MODULE_SUPERADMIN"))) {
                                throw new IllegalArgumentException(
                                                "System Tenant can only have MODULE_SUPERADMIN module. Attempted to assign: " + moduleNames);
                        }
                        // If empty list, allow it (will clear modules, but SuperAdminInitializer will restore MODULE_SUPERADMIN)
                        if (moduleNames.isEmpty()) {
                                log.warn("Clearing all modules from System Tenant. SuperAdminInitializer will restore MODULE_SUPERADMIN on next startup.");
                        }
                }

                permissionService.setModulesForTenant(tenant, moduleNames);
                log.info("Set {} modules for tenant: {}", moduleNames.size(), tenant.getName());
        }

        /**
         * Set quota limits for a tenant.
         */
        @AuditLog(action = "QUOTAS_UPDATED", resourceType = "TENANT")
        @Transactional
        public void setTenantQuotas(UUID tenantId, Map<String, Object> quotas) {
                Tenant tenant = tenantRepository.findById(tenantId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Tenant not found with id: " + tenantId));

                tenant.setQuotaLimits(quotas);
                tenantRepository.save(tenant);
                log.info("Updated quota limits for tenant: {}", tenant.getName());
        }

        // ========== User Management Methods ==========

        /**
         * Reset a user's password.
         */
        @AuditLog(action = "PASSWORD_RESET", resourceType = "USER")
        @Transactional
        public void resetUserPassword(UUID userId, String newPassword) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

                String encodedPassword = passwordEncoder.encode(newPassword);
                user.setPassword(encodedPassword);
                userRepository.save(user);
                log.info("Reset password for user: {}", user.getEmail());
        }

        /**
         * Enable or disable a user.
         */
        @AuditLog(action = "USER_ENABLED", resourceType = "USER")
        @Transactional
        public void setUserEnabled(UUID userId, boolean enabled) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

                user.setEnabled(enabled);
                userRepository.save(user);
                log.info("Set user {} enabled status to: {}", user.getEmail(), enabled);
        }

        /**
         * Search users globally by email (across all tenants).
         */
        @AuditLog(action = "USER_SEARCH", resourceType = "USER")
        @Transactional(readOnly = true)
        public List<User> searchUsersGlobally(String email) {
                return userRepository.findAllByEmailAndNotDeleted(email);
        }

        // ========== Impersonation Methods ==========

        /**
         * Start impersonation session for a user.
         * Generates a JWT token with impersonation claims.
         * CRITICAL: This action is logged to AuditLog with action "SESSION_STARTED".
         */
        @AuditLog(action = "SESSION_STARTED", resourceType = "USER")
        @Transactional(readOnly = true)
        public String impersonateUser(UUID userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

                if (!user.getEnabled()) {
                        throw new IllegalStateException("Cannot impersonate disabled user: " + user.getEmail());
                }

                // Get tenant info
                Tenant tenant = user.getTenant();
                if (tenant == null) {
                        throw new IllegalStateException("User has no tenant assigned: " + user.getEmail());
                }

                // Get user roles and permissions
                List<String> roles = user.getRoles().stream()
                                .map(Role::getName)
                                .collect(Collectors.toList());

                List<String> permissions = permissionService.getUserPermissions(user.getId());

                // Get original Super Admin user ID from SecurityContext
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                String originalUserId = null;
                if (authentication != null && authentication.isAuthenticated()) {
                        // Extract user ID from authentication (email lookup)
                        String originalEmail = authentication.getName();
                        User originalUser = userRepository.findByEmail(originalEmail).orElse(null);
                        if (originalUser != null) {
                                originalUserId = originalUser.getId().toString();
                        }
                }

                if (originalUserId == null) {
                        throw new IllegalStateException(
                                        "Cannot determine original Super Admin user ID for impersonation");
                }

                // Generate impersonation JWT with original user context
                String impersonationToken = jwtService.generateImpersonationToken(
                                user.getEmail(),
                                tenant.getId().toString(),
                                tenant.getSchemaName(),
                                roles,
                                permissions,
                                originalUserId);

                log.info("Starting impersonation session: Super Admin {} impersonating user {} (tenant: {})",
                                originalUserId, user.getEmail(), tenant.getName());

                return impersonationToken;
        }

        /**
         * Get all available modules (MODULE-level permissions) from the permissions
         * table.
         * Returns a list of maps with 'name' and 'description' keys.
         * 
         * NOTE: For System Tenant, only MODULE_SUPERADMIN should be returned.
         * This is handled at frontend level, but backend can also filter if tenantId is provided.
         */
        @Transactional(readOnly = true)
        public List<Map<String, String>> getAllAvailableModules() {
                return permissionService.getAllModuleLevelPermissions().stream()
                                .filter(permission -> !permission.getName().equals("MODULE_HEALTH")) // Exclude
                                                                                                     // deprecated
                                                                                                     // MODULE_HEALTH
                                .map(permission -> Map.of(
                                                "name", permission.getName(),
                                                "description",
                                                permission.getDescription() != null ? permission.getDescription()
                                                                : permission.getName()))
                                .collect(Collectors.toList());
        }
        
        /**
         * Get available modules for a specific tenant.
         * System Tenant will only return MODULE_SUPERADMIN.
         * 
         * @param tenantId The tenant ID
         * @return List of available modules for the tenant
         */
        @Transactional(readOnly = true)
        public List<Map<String, String>> getAvailableModulesForTenant(UUID tenantId) {
                Tenant tenant = tenantRepository.findById(tenantId)
                                .orElseThrow(() -> new IllegalArgumentException("Tenant not found with id: " + tenantId));
                
                // CRITICAL: System Tenant can only have MODULE_SUPERADMIN
                boolean isSystemTenant = "public".equals(tenant.getSchemaName()) && "SYSTEM".equals(tenant.getName());
                if (isSystemTenant) {
                        return permissionService.getAllModuleLevelPermissions().stream()
                                        .filter(permission -> permission.getName().equals("MODULE_SUPERADMIN"))
                                        .map(permission -> Map.of(
                                                        "name", permission.getName(),
                                                        "description",
                                                        permission.getDescription() != null ? permission.getDescription()
                                                                        : permission.getName()))
                                        .collect(Collectors.toList());
                }
                
                // For other tenants, return all modules except MODULE_HEALTH
                return getAllAvailableModules();
        }

        /**
         * Get all admins for a specific tenant.
         */
        @Transactional(readOnly = true)
        public List<Map<String, Object>> getTenantAdmins(UUID tenantId) {
                tenantRepository.findById(tenantId)
                                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

                // Find administrative roles
                Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                                .orElseThrow(() -> new IllegalStateException("ROLE_ADMIN not found"));
                Role superAdminRole = roleRepository.findByName("ROLE_SUPER_ADMIN")
                                .orElseThrow(() -> new IllegalStateException("ROLE_SUPER_ADMIN not found"));

                return userRepository.findAll().stream()
                                .filter(user -> user.getTenant() != null && user.getTenant().getId().equals(tenantId))
                                .filter(user -> user.getRoles().contains(adminRole)
                                                || user.getRoles().contains(superAdminRole))
                                .map(user -> Map.of(
                                                "id", (Object) user.getId(),
                                                "firstName", user.getFirstName(),
                                                "lastName", user.getLastName(),
                                                "email", user.getEmail(),
                                                "enabled", user.getEnabled()))
                                .collect(Collectors.toList());
        }

        /**
         * Add an existing user as admin to a tenant.
         */
        @Transactional
        public void addTenantAdmin(UUID tenantId, UUID userId) {
                tenantRepository.findById(tenantId)
                                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new IllegalArgumentException("User not found"));

                if (user.getTenant() == null || !user.getTenant().getId().equals(tenantId)) {
                        throw new IllegalArgumentException("User does not belong to this tenant");
                }

                Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                                .orElseThrow(() -> new IllegalStateException("ROLE_ADMIN not found"));

                if (!user.getRoles().contains(adminRole)) {
                        user.getRoles().add(adminRole);
                        userRepository.save(user);
                }
        }

        /**
         * Remove admin role from a user in a tenant.
         */
        @Transactional
        public void removeTenantAdmin(UUID tenantId, UUID userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new IllegalArgumentException("User not found"));

                if (user.getTenant() == null || !user.getTenant().getId().equals(tenantId)) {
                        throw new IllegalArgumentException("User does not belong to this tenant");
                }

                // Protect default super admin
                if ("admin@terra.com".equals(user.getEmail())) {
                        throw new IllegalArgumentException(
                                        "Cannot remove admin role from the system default super admin");
                }

                Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                                .orElseThrow(() -> new IllegalStateException("ROLE_ADMIN not found"));

                // Ensure at least one admin remains for regular tenants
                Tenant tenant = user.getTenant();
                if (!"public".equals(tenant.getSchemaName())) {
                        long adminCount = userRepository.findAll().stream()
                                        .filter(u -> u.getTenant() != null && u.getTenant().getId().equals(tenantId))
                                        .filter(u -> u.getRoles().contains(adminRole))
                                        .count();

                        if (adminCount <= 1) {
                                throw new IllegalArgumentException("Tenant must have at least one administrator");
                        }
                }

                user.getRoles().remove(adminRole);
                userRepository.save(user);
        }

        /**
         * Create a new admin user for a tenant.
         */
        @Transactional
        public Map<String, Object> createTenantAdmin(UUID tenantId, String firstName, String lastName,
                        String emailInput,
                        String password) {
                // Normalize email
                String email = emailInput.toLowerCase().trim();

                Tenant tenant = tenantRepository.findById(tenantId)
                                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

                // Enforce domain if specified
                if (tenant.getDomain() != null && !email.endsWith("@" + tenant.getDomain())) {
                        throw new IllegalArgumentException("Email must end with @" + tenant.getDomain());
                }

                // Check if user already exists
                if (userRepository.findByEmail(email).isPresent()) {
                        throw new IllegalArgumentException("User with this email already exists");
                }

                // Create new user
                User newAdmin = User.builder()
                                .firstName(firstName)
                                .lastName(lastName)
                                .email(email)
                                .password(passwordEncoder.encode(password))
                                .tenant(tenant)
                                .enabled(true)
                                .build();

                // Assign Roles
                Set<Role> roles = new java.util.HashSet<>();

                // If SYSTEM tenant (schema='public'), assign ROLE_SUPER_ADMIN
                if ("public".equals(tenant.getSchemaName())) {
                        Role superAdminRole = roleRepository.findByName("ROLE_SUPER_ADMIN")
                                        .orElseThrow(() -> new IllegalStateException("ROLE_SUPER_ADMIN not found"));
                        roles.add(superAdminRole);
                } else {
                        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                                        .orElseThrow(() -> new IllegalStateException("ROLE_ADMIN not found"));
                        roles.add(adminRole);
                }

                newAdmin.setRoles(roles);
                User savedUser = userRepository.save(newAdmin);

                // Assign all tenant permissions to the new admin (if they have ROLE_ADMIN)
                permissionService.assignAllTenantPermissionsToUser(savedUser);

                // CRITICAL: Invalidate all refresh tokens for this user to force re-login with new permissions
                // This ensures JWT token will contain updated permissions
                refreshTokenRepository.revokeAllUserTokens(savedUser.getId(), java.time.LocalDateTime.now());
                log.info("Revoked all refresh tokens for user {} to force re-login with new permissions", savedUser.getEmail());

                return Map.of(
                                "id", savedUser.getId(),
                                "firstName", savedUser.getFirstName(),
                                "lastName", savedUser.getLastName(),
                                "email", savedUser.getEmail(),
                                "enabled", savedUser.getEnabled());
        }

        /**
         * Update an existing admin user's details.
         */
        @Transactional
        public Map<String, Object> updateTenantAdmin(UUID tenantId, UUID userId, String firstName, String lastName,
                        String email, Boolean enabled) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new IllegalArgumentException("User not found"));

                if (user.getTenant() == null || !user.getTenant().getId().equals(tenantId)) {
                        throw new IllegalArgumentException("User does not belong to this tenant");
                }

                // Protect default super admin from certain changes
                if ("admin@terra.com".equals(user.getEmail())) {
                        if (enabled != null && !enabled) {
                                throw new IllegalArgumentException("Cannot disable the system default super admin");
                        }
                        // Allow name changes, but carefully
                }

                // Update fields
                if (firstName != null)
                        user.setFirstName(firstName);
                if (lastName != null)
                        user.setLastName(lastName);
                if (email != null) {
                        // Normalize email
                        email = email.toLowerCase().trim();

                        // Protect default super admin email
                        if ("admin@terra.com".equals(user.getEmail()) && !email.equals(user.getEmail())) {
                                throw new IllegalArgumentException(
                                                "Cannot change the email of the system default super admin");
                        }

                        // Enforce domain if specified
                        Tenant tenant = user.getTenant();
                        if (tenant.getDomain() != null && !email.endsWith("@" + tenant.getDomain())) {
                                throw new IllegalArgumentException("Email must end with @" + tenant.getDomain());
                        }

                        // Check if email is already taken by another user
                        userRepository.findByEmail(email).ifPresent(existingUser -> {
                                if (!existingUser.getId().equals(userId)) {
                                        throw new IllegalArgumentException("Email already in use");
                                }
                        });
                        user.setEmail(email);
                }
                if (enabled != null)
                        user.setEnabled(enabled);

                User updatedUser = userRepository.save(user);

                return Map.of(
                                "id", updatedUser.getId(),
                                "firstName", updatedUser.getFirstName(),
                                "lastName", updatedUser.getLastName(),
                                "email", updatedUser.getEmail(),
                                "enabled", updatedUser.getEnabled());
        }

        /**
         * Reset password for a tenant admin.
         */
        @Transactional
        public void resetTenantAdminPassword(UUID tenantId, UUID userId, String newPassword) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new IllegalArgumentException("User not found"));

                if (user.getTenant() == null || !user.getTenant().getId().equals(tenantId)) {
                        throw new IllegalArgumentException("User does not belong to this tenant");
                }

                // Optional: Admin might want to reset default super admin password too if they
                // are another super admin.
                // But let's keep it safe.

                user.setPassword(passwordEncoder.encode(newPassword));
                userRepository.save(user);
        }
}
