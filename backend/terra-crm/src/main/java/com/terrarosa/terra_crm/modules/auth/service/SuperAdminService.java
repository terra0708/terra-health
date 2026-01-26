package com.terrarosa.terra_crm.modules.auth.service;

import com.terrarosa.terra_crm.core.tenancy.entity.Tenant;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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
    private final TenantService tenantService;
    private final PermissionService permissionService;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    
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
}
