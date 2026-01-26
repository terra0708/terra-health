package com.terrarosa.terra_crm.modules.auth.service;

import com.terrarosa.terra_crm.core.security.service.JwtService;
import com.terrarosa.terra_crm.core.tenancy.entity.Tenant;
import com.terrarosa.terra_crm.core.tenancy.repository.TenantRepository;
import com.terrarosa.terra_crm.core.tenancy.service.TenantService;
import com.terrarosa.terra_crm.modules.auth.dto.LoginRequest;
import com.terrarosa.terra_crm.modules.auth.dto.LoginResponse;
import com.terrarosa.terra_crm.modules.auth.dto.RefreshTokenResponse;
import com.terrarosa.terra_crm.modules.auth.dto.RegisterRequest;
import com.terrarosa.terra_crm.modules.auth.dto.UserDto;
import com.terrarosa.terra_crm.modules.auth.entity.RefreshToken;
import com.terrarosa.terra_crm.modules.auth.entity.Role;
import com.terrarosa.terra_crm.modules.auth.entity.User;
import com.terrarosa.terra_crm.modules.auth.repository.RefreshTokenRepository;
import com.terrarosa.terra_crm.modules.auth.repository.RoleRepository;
import com.terrarosa.terra_crm.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
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
    private final RefreshTokenRepository refreshTokenRepository;
    
    /**
     * Login user with email and password.
     * Validates that user belongs to the tenant specified in X-Tenant-ID header.
     */
//    @Transactional(readOnly = true)
    @Transactional
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
        
        // Extract roles to check if user is Super Admin
        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());
        boolean isSuperAdmin = roles.contains("ROLE_SUPER_ADMIN");
        
        // Get tenant and schema name
        Tenant tenant = user.getTenant();
        String userTenantId = tenant.getId().toString();
        String schemaName = tenant.getSchemaName();
        
        // Super Admin special handling
        if (isSuperAdmin) {
            // Super Admin uses SYSTEM tenant and public schema
            // X-Tenant-ID header should be SYSTEM tenant's ID
            Tenant systemTenant = tenantService.getSystemTenant();
            String systemTenantId = systemTenant.getId().toString();
            
            if (tenantIdHeader == null || tenantIdHeader.isBlank()) {
                // If no header provided, use SYSTEM tenant ID
                tenantIdHeader = systemTenantId;
            } else if (!systemTenantId.equals(tenantIdHeader)) {
                log.error("Super Admin tenant mismatch: Expected SYSTEM tenantId={}, Header tenantId={}", 
                        systemTenantId, tenantIdHeader);
                throw new BadCredentialsException("Super Admin must use SYSTEM tenant ID");
            }
            
            // Override schema name to public for Super Admin
            schemaName = "public";
            log.debug("Super Admin login: tenantId={}, schemaName=public", systemTenantId);
        } else {
            // Normal tenant user handling
            // CRITICAL: Validate tenant ID from header matches user's tenant
            if (tenantIdHeader == null || tenantIdHeader.isBlank()) {
                throw new IllegalArgumentException("X-Tenant-ID header is required");
            }
            
            if (!userTenantId.equals(tenantIdHeader)) {
                log.error("Tenant mismatch: User tenantId={}, Header tenantId={}", userTenantId, tenantIdHeader);
                throw new BadCredentialsException("User does not belong to the specified tenant");
            }
        }
        
        // Fetch user permissions (Super Admin doesn't need permissions, role-based access)
        List<String> permissions = isSuperAdmin ? List.of() : permissionService.getUserPermissions(user.getId());
        log.debug("User {} has {} permissions: {}", user.getEmail(), permissions.size(), permissions);
        
        if (!isSuperAdmin && permissions.isEmpty()) {
            log.warn("User {} has no permissions assigned. This may indicate a problem with permission assignment.", user.getEmail());
        }
        
        // Generate access token (15 minutes)
        String accessToken = jwtService.generateAccessToken(
                user.getEmail(),
                userTenantId,
                schemaName,
                roles,
                permissions
        );
        
        log.debug("Generated access token for user {} with {} permissions", user.getEmail(), permissions.size());
        
        // Generate refresh token (7 days) with token rotation
        String tokenId = UUID.randomUUID().toString();
        String refreshTokenString = jwtService.generateRefreshToken(user.getEmail(), tokenId);
        
        // Save refresh token to database
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(7);
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(refreshTokenString)
                .expiresAt(expiresAt)
                .revoked(false)
                .build();
        
        refreshTokenRepository.save(refreshToken);
        log.debug("Created refresh token for user {} with tokenId {}", user.getEmail(), tokenId);
        
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
                .token(accessToken) // Access token in JSON body
                .user(userDto)
                .expiresIn(900000L) // 15 minutes in milliseconds
                .refreshToken(refreshTokenString) // Refresh token (will be sent as cookie by controller)
                .build();
    }
    
    /**
     * Refresh access token using refresh token from cookie.
     * Implements token rotation: old refresh token is invalidated, new one is created.
     * 
     * @param refreshTokenString Refresh token from cookie
     * @return RefreshTokenResponse containing new access token and refresh token
     */
    @Transactional
    public RefreshTokenResponse refreshToken(String refreshTokenString) {
        // Validate refresh token format and expiration
        if (!jwtService.validateRefreshToken(refreshTokenString)) {
            log.warn("Invalid refresh token format or expired");
            throw new BadCredentialsException("Invalid or expired refresh token");
        }
        
        // Find refresh token in database
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenString)
                .orElseThrow(() -> {
                    log.warn("Refresh token not found in database");
                    return new BadCredentialsException("Invalid refresh token");
                });
        
        // Check if token is valid (not revoked, not expired)
        if (!refreshToken.isValid()) {
            log.warn("Refresh token is revoked or expired for user {}", refreshToken.getUser().getEmail());
            throw new BadCredentialsException("Refresh token is invalid");
        }
        
        // CRITICAL: Token Rotation - Revoke old token
        refreshToken.revoke();
        refreshTokenRepository.save(refreshToken);
        log.debug("Revoked old refresh token for user {}", refreshToken.getUser().getEmail());
        
        // Get user and permissions
        User user = refreshToken.getUser();
        
        // Extract roles
        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());
        boolean isSuperAdmin = roles.contains("ROLE_SUPER_ADMIN");
        
        // Get tenant and schema
        Tenant tenant = user.getTenant();
        String userTenantId = tenant.getId().toString();
        String schemaName = tenant.getSchemaName();
        
        if (isSuperAdmin) {
            schemaName = "public";
        }
        
        // Fetch permissions
        List<String> permissions = isSuperAdmin ? List.of() : permissionService.getUserPermissions(user.getId());
        
        // Generate new access token
        String newAccessToken = jwtService.generateAccessToken(
                user.getEmail(),
                userTenantId,
                schemaName,
                roles,
                permissions
        );
        
        // Generate new refresh token (token rotation)
        String newTokenId = UUID.randomUUID().toString();
        String newRefreshTokenString = jwtService.generateRefreshToken(user.getEmail(), newTokenId);
        
        // Save new refresh token to database
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(7);
        RefreshToken newRefreshToken = RefreshToken.builder()
                .user(user)
                .token(newRefreshTokenString)
                .expiresAt(expiresAt)
                .revoked(false)
                .build();
        
        refreshTokenRepository.save(newRefreshToken);
        log.info("Generated new access and refresh tokens for user {} (token rotation)", user.getEmail());
        
        return RefreshTokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshTokenString) // Will be sent as cookie by controller
                .expiresIn(900000L) // 15 minutes
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
