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
     * Create a new tenant with admin user and assigned modules in a single atomic operation.
     * 
     * CRITICAL: This method performs the following steps atomically:
     * 1. Validates email uniqueness (before transaction)
     * 2. Creates tenant and schema (TenantService.createTenant)
     * 3. Assigns modules to tenant
     * 4. Creates admin user in public.users table
     * 5. Assigns ROLE_ADMIN role
     * 6. Assigns all ACTION permissions from selected modules
     * 
     * All operations run in public schema except tenant schema creation (which is outside transaction).
     * 
     * @param request Tenant creation request with admin details and module names
     * @return TenantDto and TenantAdminDto containing created tenant and admin information
     */
    @Transactional
    public TenantAdminCreationResult createTenantWithAdminAndModules(CreateTenantRequest request) {
        // CRITICAL: Email uniqueness check BEFORE transaction (read-only)
        // This prevents deadlocks and improves performance
        if (userRepository.findByEmail(request.getAdminEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already exists: " + request.getAdminEmail());
        }
        
        log.info("Creating tenant '{}' with admin user '{}' and {} modules", 
                request.getTenantName(), request.getAdminEmail(), request.getModuleNames().size());
        
        // Step A: Create tenant (this includes schema creation via Flyway, outside transaction)
        Tenant tenant = tenantService.createTenant(request.getTenantName());
        log.info("Created tenant: id={}, name={}, schemaName={}", tenant.getId(), tenant.getName(), tenant.getSchemaName());
        
        // Step B: Assign modules to tenant (overrides default core modules)
        // Clear existing modules first (if any were assigned by createTenant)
        // Then assign requested modules
        permissionService.assignModulesToTenant(tenant, request.getModuleNames());
        log.info("Assigned {} modules to tenant {}", request.getModuleNames().size(), tenant.getName());
        
        // Step C: Create admin user in public.users table
        String encodedPassword = passwordEncoder.encode(request.getAdminPassword());
        User adminUser = User.builder()
                .email(request.getAdminEmail())
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
        
        // Build response DTOs
        TenantDto tenantDto = TenantDto.builder()
                .id(tenant.getId())
                .name(tenant.getName())
                .schemaName(tenant.getSchemaName())
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
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found with id: " + tenantId));
        
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
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found with id: " + tenantId));
        
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
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found with id: " + tenantId));
        
        tenantRepository.hardDeleteById(tenantId);
        log.warn("Hard deleted tenant: {} (id: {})", tenant.getName(), tenantId);
    }
    
    /**
     * Toggle a module for a tenant (feature flag).
     */
    @AuditLog(action = "MODULE_TOGGLED", resourceType = "TENANT")
    @Transactional
    public void toggleModuleForTenant(UUID tenantId, String moduleName, boolean enabled) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found with id: " + tenantId));
        
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
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found with id: " + tenantId));
        
        return permissionService.getTenantModules(tenant.getId()).stream()
                .map(permission -> permission.getName())
                .collect(Collectors.toList());
    }
    
    /**
     * Set quota limits for a tenant.
     */
    @AuditLog(action = "QUOTAS_UPDATED", resourceType = "TENANT")
    @Transactional
    public void setTenantQuotas(UUID tenantId, Map<String, Object> quotas) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found with id: " + tenantId));
        
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
            throw new IllegalStateException("Cannot determine original Super Admin user ID for impersonation");
        }
        
        // Generate impersonation JWT with original user context
        String impersonationToken = jwtService.generateImpersonationToken(
                user.getEmail(),
                tenant.getId().toString(),
                tenant.getSchemaName(),
                roles,
                permissions,
                originalUserId
        );
        
        log.info("Starting impersonation session: Super Admin {} impersonating user {} (tenant: {})", 
                originalUserId, user.getEmail(), tenant.getName());
        
        return impersonationToken;
    }
}
