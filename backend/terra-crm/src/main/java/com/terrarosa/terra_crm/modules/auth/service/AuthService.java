package com.terrarosa.terra_crm.modules.auth.service;

import com.terrarosa.terra_crm.core.security.service.JwtService;
import com.terrarosa.terra_crm.core.tenancy.entity.Tenant;
import com.terrarosa.terra_crm.core.tenancy.repository.TenantRepository;
import com.terrarosa.terra_crm.core.tenancy.service.TenantService;
import com.terrarosa.terra_crm.modules.auth.dto.LoginRequest;
import com.terrarosa.terra_crm.modules.auth.dto.LoginResponse;
import com.terrarosa.terra_crm.modules.auth.dto.RegisterRequest;
import com.terrarosa.terra_crm.modules.auth.dto.UserDto;
import com.terrarosa.terra_crm.modules.auth.entity.Role;
import com.terrarosa.terra_crm.modules.auth.entity.User;
import com.terrarosa.terra_crm.modules.auth.repository.RoleRepository;
import com.terrarosa.terra_crm.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final TenantRepository tenantRepository;
    private final TenantService tenantService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PermissionService permissionService;
    
    /**
     * Login user with email and password.
     * Validates that user belongs to the tenant specified in X-Tenant-ID header.
     */
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request, String tenantIdHeader) {
        // CRITICAL: Ensure we're querying in public schema for login
        // TenantContext should be set by TenantInterceptor, but verify it
        String currentSchema = com.terrarosa.terra_crm.core.tenancy.TenantContext.getCurrentSchemaName();
        log.debug("Login attempt for email: {}, current schema: {}, tenantId header: {}", 
                request.getEmail(), currentSchema, tenantIdHeader);
        
        // Find user by email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.error("User not found with email: {} in schema: {}", request.getEmail(), currentSchema);
                    return new BadCredentialsException("Invalid email or password");
                });
        
        log.debug("User found: id={}, email={}, tenantId={}, enabled={}, deleted={}", 
                user.getId(), user.getEmail(), user.getTenant().getId(), user.getEnabled(), user.getDeleted());
        
        // Validate password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        
        // Check if user is enabled
        if (!user.getEnabled()) {
            throw new BadCredentialsException("User account is disabled");
        }
        
        // CRITICAL: Validate tenant ID from header matches user's tenant
        if (tenantIdHeader == null || tenantIdHeader.isBlank()) {
            throw new IllegalArgumentException("X-Tenant-ID header is required");
        }
        
        String userTenantId = user.getTenant().getId().toString();
        if (!userTenantId.equals(tenantIdHeader)) {
            log.error("Tenant mismatch: User tenantId={}, Header tenantId={}", userTenantId, tenantIdHeader);
            throw new BadCredentialsException("User does not belong to the specified tenant");
        }
        
        // Get tenant and schema name
        Tenant tenant = user.getTenant();
        String schemaName = tenant.getSchemaName();
        
        // Extract roles
        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());
        
        // Fetch user permissions
        List<String> permissions = permissionService.getUserPermissions(user.getId());
        log.debug("User {} has {} permissions: {}", user.getEmail(), permissions.size(), permissions);
        
        if (permissions.isEmpty()) {
            log.warn("User {} has no permissions assigned. This may indicate a problem with permission assignment.", user.getEmail());
        }
        
        // Generate JWT token with permissions
        String token = jwtService.generateToken(
                user.getEmail(),
                userTenantId,
                schemaName,
                roles,
                permissions
        );
        
        log.debug("Generated JWT token for user {} with {} permissions", user.getEmail(), permissions.size());
        
        // Build user DTO
        UserDto userDto = UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .tenantId(user.getTenant().getId())
                .roles(roles)
                .build();
        
        return LoginResponse.builder()
                .token(token)
                .user(userDto)
                .expiresIn(86400000L) // 24 hours in milliseconds
                .build();
    }
    
    /**
     * Register a new user.
     * Supports two scenarios:
     * 1. Register to existing tenant: Provide tenantId
     * 2. Create new tenant and register first user: Provide tenantName (tenantId must be null)
     */
    @Transactional
    public UserDto register(RegisterRequest request) {
        // Check if user already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("User with email " + request.getEmail() + " already exists");
        }
        
        // Resolve tenant: either use existing or create new
        Tenant tenant;
        if (request.getTenantId() != null) {
            // Scenario 1: Register to existing tenant
            tenant = tenantRepository.findById(request.getTenantId())
                    .orElseThrow(() -> new IllegalArgumentException("Tenant not found with id: " + request.getTenantId()));
            log.info("Registering user {} to existing tenant: {}", request.getEmail(), tenant.getName());
        } else if (request.getTenantName() != null && !request.getTenantName().isBlank()) {
            // Scenario 2: Create new tenant and register first user
            log.info("Creating new tenant '{}' and registering first user: {}", request.getTenantName(), request.getEmail());
            tenant = tenantService.createTenant(request.getTenantName());
            log.info("Created new tenant: id={}, name={}, schemaName={}", tenant.getId(), tenant.getName(), tenant.getSchemaName());
        } else {
            throw new IllegalArgumentException("Either tenantId (for existing tenant) or tenantName (for new tenant) must be provided");
        }
        
        // Encode password
        String encodedPassword = passwordEncoder.encode(request.getPassword());
        
        // Create user
        User user = User.builder()
                .email(request.getEmail())
                .password(encodedPassword)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .tenant(tenant)
                .enabled(true)
                .build();
        
        // Assign default role (ROLE_AGENT) if no roles specified
        Role defaultRole = roleRepository.findByName("ROLE_AGENT")
                .orElseThrow(() -> new IllegalStateException("Default role ROLE_AGENT not found. Run migrations."));
        user.getRoles().add(defaultRole);
        
        User savedUser = userRepository.save(user);
        
        // CRITICAL: Check if this is the first user for the tenant
        // If first user, assign all permissions from tenant's module pool
        long userCount = userRepository.countByTenantId(tenant.getId());
        if (userCount == 1) {
            // This is the first user - assign all tenant permissions
            log.info("First user registered for tenant {}. Assigning all permissions.", tenant.getName());
            permissionService.assignAllTenantPermissionsToUser(savedUser);
        }
        
        // Build and return user DTO
        List<String> roles = savedUser.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());
        
        return UserDto.builder()
                .id(savedUser.getId())
                .email(savedUser.getEmail())
                .firstName(savedUser.getFirstName())
                .lastName(savedUser.getLastName())
                .tenantId(savedUser.getTenant().getId())
                .roles(roles)
                .build();
    }
}
