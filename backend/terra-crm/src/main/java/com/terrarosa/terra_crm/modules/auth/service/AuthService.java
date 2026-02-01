package com.terrarosa.terra_crm.modules.auth.service;

import com.terrarosa.terra_crm.core.security.service.JwtService;
import com.terrarosa.terra_crm.core.tenancy.entity.Tenant;
import com.terrarosa.terra_crm.core.tenancy.repository.TenantRepository;
import com.terrarosa.terra_crm.core.tenancy.service.TenantService;
import com.terrarosa.terra_crm.modules.auth.dto.LoginRequest;
import com.terrarosa.terra_crm.modules.auth.dto.LoginResponse;
import com.terrarosa.terra_crm.modules.auth.dto.RefreshTokenResponse;
import com.terrarosa.terra_crm.modules.auth.dto.RegisterRequest;
import com.terrarosa.terra_crm.modules.auth.dto.TenantDiscoveryRequest;
import com.terrarosa.terra_crm.modules.auth.dto.TenantDiscoveryResponse;
import com.terrarosa.terra_crm.modules.auth.dto.TenantInfo;
import com.terrarosa.terra_crm.modules.auth.dto.UserDto;
import com.terrarosa.terra_crm.modules.auth.dto.CurrentUserResponse;
import com.terrarosa.terra_crm.modules.auth.entity.RefreshToken;
import com.terrarosa.terra_crm.modules.auth.entity.Role;
import com.terrarosa.terra_crm.modules.auth.entity.User;
import com.terrarosa.terra_crm.modules.auth.repository.RefreshTokenRepository;
import com.terrarosa.terra_crm.modules.auth.repository.RoleRepository;
import com.terrarosa.terra_crm.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.terrarosa.terra_crm.core.quota.service.QuotaService;
import com.terrarosa.terra_crm.core.security.config.PermissionEvaluator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
    private final QuotaService quotaService;

    /**
     * Login user with email and password.
     * Validates that user belongs to the tenant specified in X-Tenant-ID header.
     */
    // @Transactional(readOnly = true)
    @Transactional
    public LoginResponse login(LoginRequest request, String tenantIdHeader) {
        // CRITICAL: Ensure we're querying in public schema for login
        // TenantContext should be set by TenantInterceptor, but verify it
        String currentSchema = com.terrarosa.terra_crm.core.tenancy.TenantContext.getCurrentSchemaName();
        // Normalize email
        String email = request.getEmail().toLowerCase().trim();
        log.debug("Login attempt for email: {}, current schema: {}, tenantId header: {}",
                email, currentSchema, tenantIdHeader);

        // Find user by email
        User user = userRepository.findByEmail(email)
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

        // Check if tenant is active
        if (tenant.getStatus() != com.terrarosa.terra_crm.core.tenancy.entity.TenantStatus.ACTIVE) {
            log.warn("Login attempt for user {} failed because tenant {} is not ACTIVE (status: {})",
                    user.getEmail(), tenant.getName(), tenant.getStatus());
            throw new BadCredentialsException("Tenant is suspended or inactive. Please contact support.");
        }

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
            // Normal tenant user handling (lenient)
            if (tenantIdHeader != null && !tenantIdHeader.isBlank()) {
                if (!userTenantId.equals(tenantIdHeader)) {
                    log.warn(
                            "Tenant mismatch in header: Header tenantId={}, User actual tenantId={}. Using user's actual tenant.",
                            tenantIdHeader, userTenantId);
                    tenantIdHeader = userTenantId;
                }
            } else {
                // If no header, use the user's own tenant
                log.info("No X-Tenant-ID header provided, using user's tenant ID: {}", userTenantId);
                tenantIdHeader = userTenantId;
            }

            log.debug("User login: email={}, tenantId={}, schemaName={}", request.getEmail(), tenantIdHeader,
                    schemaName);
        }

        // Fetch all user permissions
        // CRITICAL: Super Admin also needs permissions for @PreAuthorize checks
        // Super Admin has all permissions assigned via SuperAdminInitializer
        List<String> allPermissions = permissionService.getUserPermissions(user.getId());
        log.debug("User {} has {} total permissions: {}", user.getEmail(), allPermissions.size(), allPermissions);

        if (allPermissions.isEmpty()) {
            log.warn("User {} has no permissions assigned. This may indicate a problem with permission assignment.",
                    user.getEmail());
        }

        // CRITICAL: JWT Optimization - Only include MODULE_* permissions in JWT
        // ACTION permissions will be fetched separately from /api/v1/tenant-admin/permissions endpoint
        List<String> jwtPermissions = filterModulePermissions(allPermissions);
        log.debug("User {} has {} MODULE permissions for JWT: {}", user.getEmail(), jwtPermissions.size(), jwtPermissions);

        // Generate access token (15 minutes) - only MODULE permissions in JWT
        String accessToken = jwtService.generateAccessToken(
                user.getEmail(),
                userTenantId,
                schemaName,
                roles,
                jwtPermissions);

        log.debug("Generated access token for user {} with {} MODULE permissions", user.getEmail(), jwtPermissions.size());

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
        // CRITICAL: UserDto.permissions contains only MODULE permissions (same as JWT)
        // ACTION permissions will be fetched separately from frontend
        UserDto userDto = UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .tenantId(user.getTenant().getId())
                .roles(roles)
                .permissions(jwtPermissions) // Only MODULE permissions
                .build();

        return LoginResponse.builder()
                .token(accessToken) // Access token in JSON body
                .user(userDto)
                .expiresIn(900000L) // 15 minutes in milliseconds
                .refreshToken(refreshTokenString) // Refresh token (will be sent as cookie by controller)
                .build();
    }

    /**
     * Create authentication response (access token and optionally refresh token).
     * Helper method to avoid code duplication (DRY principle).
     * 
     * @param user                User entity
     * @param includeRefreshToken If true, generates and saves new refresh token
     *                            (token rotation)
     * @return RefreshTokenResponse with access token and optionally refresh token
     */
    private RefreshTokenResponse createAuthResponse(User user, boolean includeRefreshToken) {
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

        // Fetch all user permissions
        // CRITICAL FIX: Super Admin's permissions are already assigned in database
        // Do not return empty list - getUserPermissions() will return all permissions for Super Admin
        List<String> allPermissions = permissionService.getUserPermissions(user.getId());

        // CRITICAL: JWT Optimization - Only include MODULE_* permissions in JWT
        // ACTION permissions will be fetched separately from /api/v1/tenant-admin/permissions endpoint
        List<String> jwtPermissions = filterModulePermissions(allPermissions);

        // Generate access token - only MODULE permissions in JWT
        String accessToken = jwtService.generateAccessToken(
                user.getEmail(),
                userTenantId,
                schemaName,
                roles,
                jwtPermissions);

        RefreshTokenResponse.RefreshTokenResponseBuilder responseBuilder = RefreshTokenResponse.builder()
                .accessToken(accessToken)
                .expiresIn(900000L); // 15 minutes

        if (includeRefreshToken) {
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
            responseBuilder.refreshToken(newRefreshTokenString);
            log.info("Generated new access and refresh tokens for user {} (token rotation)", user.getEmail());
        } else {
            // Grace period: No refresh token rotation
            responseBuilder.refreshToken(null);
        }

        return responseBuilder.build();
    }

    /**
     * Filter permissions to include only MODULE-level permissions for JWT.
     * ACTION-level permissions are excluded from JWT to reduce token size.
     * They will be fetched separately from /api/v1/tenant-admin/permissions endpoint.
     * 
     * @param allPermissions All user permissions (MODULE + ACTION)
     * @return Filtered list containing only MODULE_* permissions
     */
    private List<String> filterModulePermissions(List<String> allPermissions) {
        return allPermissions.stream()
                .filter(permission -> permission.startsWith("MODULE_"))
                .collect(Collectors.toList());
    }

    /**
     * Refresh access token using refresh token from cookie.
     * Implements token rotation: old refresh token is invalidated, new one is
     * created.
     * Includes grace period (30 seconds) for revoked tokens to handle race
     * conditions.
     * 
     * @param refreshTokenString Refresh token from cookie
     * @return RefreshTokenResponse containing new access token and refresh token
     *         (or null if grace period)
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

        // Check if token is expired
        if (refreshToken.isExpired()) {
            log.warn("Refresh token is expired for user {}", refreshToken.getUser().getEmail());
            throw new BadCredentialsException("Refresh token is expired");
        }

        // Check if token is revoked - implement grace period (MANUEL KONTROL, isValid()
        // kullanma)
        if (refreshToken.getRevoked()) {
            LocalDateTime revokedAt = refreshToken.getRevokedAt();
            if (revokedAt == null) {
                // Old token without revokedAt timestamp - reject
                log.warn("Revoked token without revokedAt timestamp. Token ID: {}", refreshToken.getId());
                throw new BadCredentialsException("Refresh token is invalid");
            }

            // Calculate time since revocation
            long secondsSinceRevocation = java.time.Duration.between(revokedAt, LocalDateTime.now()).getSeconds();

            if (secondsSinceRevocation < 30) {
                // Grace period: Accept request but don't rotate token
                log.warn("Revoked token accepted within grace period. Token ID: {}", refreshToken.getId());

                // Use helper method with includeRefreshToken = false
                User user = refreshToken.getUser();
                return createAuthResponse(user, false);
            } else {
                // Reuse attack: Token revoked more than 30 seconds ago
                log.error(
                        "Potential token reuse attack detected. Token ID: {}, revokedAt: {}, secondsSinceRevocation: {}",
                        refreshToken.getId(), revokedAt, secondsSinceRevocation);
                throw new BadCredentialsException("Refresh token has been revoked");
            }
        }

        // Normal flow: Token is valid, perform rotation
        // CRITICAL: Token Rotation - Revoke old token
        refreshToken.revoke();
        refreshTokenRepository.save(refreshToken);
        log.debug("Revoked old refresh token for user {}", refreshToken.getUser().getEmail());

        // Use helper method with includeRefreshToken = true
        User user = refreshToken.getUser();
        return createAuthResponse(user, true);
    }

    /**
     * Register a new user.
     * Supports two scenarios:
     * 1. Register to existing tenant: Provide tenantId
     * 2. Create new tenant and register first user: Provide tenantName (tenantId
     * must be null)
     */
    @Transactional
    public UserDto register(RegisterRequest request) {
        // Normalize email
        String email = request.getEmail().toLowerCase().trim();

        // Check if user already exists
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("User with email " + email + " already exists");
        }

        // Resolve tenant: either use existing or create new
        Tenant tenant;
        if (request.getTenantId() != null) {
            // Scenario 1: Register to existing tenant
            tenant = tenantRepository.findById(request.getTenantId())
                    .orElseThrow(
                            () -> new IllegalArgumentException("Tenant not found with id: " + request.getTenantId()));
            log.info("Registering user {} to existing tenant: {}", request.getEmail(), tenant.getName());
        } else if (request.getTenantName() != null && !request.getTenantName().isBlank()) {
            // Scenario 2: Create new tenant and register first user
            log.info("Creating new tenant '{}' and registering first user: {}", request.getTenantName(),
                    email);
            tenant = tenantService.createTenant(request.getTenantName());
            log.info("Created new tenant: id={}, name={}, schemaName={}", tenant.getId(), tenant.getName(),
                    tenant.getSchemaName());
        } else {
            throw new IllegalArgumentException(
                    "Either tenantId (for existing tenant) or tenantName (for new tenant) must be provided");
        }

        // Domain enforcement
        if (tenant.getDomain() != null && !email.endsWith("@" + tenant.getDomain())) {
            throw new IllegalArgumentException("Email must end with @" + tenant.getDomain());
        }

        // Quota enforcement (only for non-first users or if we want to be strict)
        long userCount = userRepository.countByTenantId(tenant.getId());
        quotaService.validateQuota(tenant.getId(), "users", userCount);

        // Encode password
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // Create user
        User user = User.builder()
                .email(email)
                .password(encodedPassword)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .tenant(tenant)
                .enabled(true)
                .build();

        // First user of tenant gets ROLE_ADMIN (tenant admin); others get ROLE_AGENT
        // CRITICAL: TenantAdminController requires ROLE_ADMIN for /api/v1/tenant-admin/* (bundles, users, etc.)
        userCount = userRepository.countByTenantId(tenant.getId());
        boolean isFirstUser = (userCount == 0);
        Role roleToAssign = isFirstUser
                ? roleRepository.findByName("ROLE_ADMIN")
                        .orElseThrow(() -> new IllegalStateException("Role ROLE_ADMIN not found. Run migrations."))
                : roleRepository.findByName("ROLE_AGENT")
                        .orElseThrow(() -> new IllegalStateException("Default role ROLE_AGENT not found. Run migrations."));
        user.getRoles().add(roleToAssign);
        if (isFirstUser) {
            log.info("First user for tenant {} - assigning ROLE_ADMIN (tenant admin).", tenant.getName());
        }

        User savedUser = userRepository.save(user);

        // CRITICAL: If first user, assign all permissions from tenant's module pool
        userCount = userRepository.countByTenantId(tenant.getId());
        if (userCount == 1) {
            log.info("First user registered for tenant {}. Assigning all permissions.", tenant.getName());
            permissionService.assignAllTenantPermissionsToUser(savedUser);
        }

        // Build and return user DTO
        List<String> roles = savedUser.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());
        List<String> permissions = permissionService.getUserPermissions(savedUser.getId());

        return UserDto.builder()
                .id(savedUser.getId())
                .email(savedUser.getEmail())
                .firstName(savedUser.getFirstName())
                .lastName(savedUser.getLastName())
                .tenantId(savedUser.getTenant().getId())
                .roles(roles)
                .permissions(permissions)
                .build();
    }

    /**
     * Discover tenant(s) associated with an email address.
     * 
     * SECURITY NOTE: This method always returns a success response, even if no
     * tenants are found.
     * This prevents user enumeration attacks where attackers could determine which
     * emails exist in the system.
     * 
     * @param request TenantDiscoveryRequest containing email
     * @return TenantDiscoveryResponse with list of tenants (empty list if none
     *         found, but still success)
     */
    @Transactional(readOnly = true)
    public TenantDiscoveryResponse discoverTenants(TenantDiscoveryRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        log.debug("Tenant discovery requested for email: {}", email);

        // Find all users with this email (excluding deleted and disabled)
        List<User> users = userRepository.findAllByEmailAndNotDeleted(email);

        if (users.isEmpty()) {
            // SECURITY: Return empty list but still success to prevent user enumeration
            log.debug("No tenants found for email: {} (returning empty list to prevent enumeration)", email);
            return TenantDiscoveryResponse.builder()
                    .tenants(new ArrayList<>())
                    .build();
        }

        // Extract unique tenant information
        List<TenantInfo> tenantInfos = users.stream()
                .map(user -> {
                    Tenant tenant = user.getTenant();
                    return TenantInfo.builder()
                            .tenantId(tenant.getId())
                            .tenantName(tenant.getName())
                            .schemaName(tenant.getSchemaName())
                            .build();
                })
                .distinct() // Remove duplicates if user has multiple accounts in same tenant
                .collect(Collectors.toList());

        log.debug("Found {} tenant(s) for email: {}", tenantInfos.size(), email);

        return TenantDiscoveryResponse.builder()
                .tenants(tenantInfos)
                .build();
    }
    
    /**
     * Revoke a refresh token by token string.
     * Used during logout to invalidate the refresh token.
     * 
     * @param refreshTokenString Refresh token string to revoke
     */
    @Transactional
    public void revokeRefreshToken(String refreshTokenString) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenString)
                .orElse(null);
        
        if (refreshToken != null && !refreshToken.getRevoked()) {
            refreshToken.revoke();
            refreshTokenRepository.save(refreshToken);
            log.debug("Revoked refresh token for user {}", refreshToken.getUser().getEmail());
        } else {
            log.warn("Refresh token not found or already revoked: {}", refreshTokenString);
        }
    }
    
    /**
     * Get current authenticated user information from JWT token.
     * 
     * PERFORMANCE OPTIMIZATION: Reads user data primarily from JWT claims (no DB query).
     * Only queries database for firstName, lastName, and id if not available in JWT.
     * 
     * CRITICAL: This method extracts token from SecurityContext which is set by
     * JwtAuthenticationFilter. Token is already validated at filter level.
     * 
     * @return CurrentUserResponse with user information and impersonation status
     * @throws BadCredentialsException if user is not authenticated or token is invalid
     */
    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUser() {
        // Get authentication from SecurityContext (set by JwtAuthenticationFilter)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            log.warn("getCurrentUser called but user is not authenticated");
            throw new BadCredentialsException("User is not authenticated");
        }
        
        // Extract token from authentication details
        String token = null;
        if (authentication.getDetails() instanceof PermissionEvaluator.JwtAuthenticationDetails) {
            PermissionEvaluator.JwtAuthenticationDetails jwtDetails = 
                    (PermissionEvaluator.JwtAuthenticationDetails) authentication.getDetails();
            token = jwtDetails.getToken();
        }
        
        if (token == null || token.isBlank()) {
            log.error("Token not found in authentication details");
            throw new BadCredentialsException("Invalid authentication token");
        }
        
        // Extract user information from JWT claims (NO DATABASE QUERY)
        String email = jwtService.extractEmail(token);
        String tenantIdStr = jwtService.extractTenantId(token);
        List<String> roles = jwtService.extractRoles(token);
        List<String> permissions = jwtService.extractPermissions(token); // Already expanded from compressed format
        
        if (email == null || email.isBlank()) {
            log.error("Email not found in JWT token");
            throw new BadCredentialsException("Invalid JWT token: missing email");
        }
        
        UUID tenantId = null;
        if (tenantIdStr != null && !tenantIdStr.isBlank()) {
            try {
                tenantId = UUID.fromString(tenantIdStr);
            } catch (IllegalArgumentException e) {
                log.error("Invalid tenantId format in JWT: {}", tenantIdStr);
                throw new BadCredentialsException("Invalid tenant ID format");
            }
        }
        
        // Check if this is an impersonation token
        boolean isImpersonation = jwtService.isImpersonationToken(token);
        String impersonatedEmail = null;
        String originalUserId = null;
        String originalEmail = null;
        
        if (isImpersonation) {
            // Extract impersonation information from token
            impersonatedEmail = jwtService.extractImpersonatedUserId(token);
            originalUserId = jwtService.extractOriginalUserId(token);
            
            // Optional: Load original user email from database (for display purposes)
            if (originalUserId != null && !originalUserId.isBlank()) {
                try {
                    UUID originalUserUuid = UUID.fromString(originalUserId);
                    User originalUser = userRepository.findById(originalUserUuid).orElse(null);
                    if (originalUser != null) {
                        originalEmail = originalUser.getEmail();
                    }
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid originalUserId format in impersonation token: {}", originalUserId);
                }
            }
        }
        
        // MINIMAL DATABASE QUERY: Only fetch firstName, lastName, and id if needed
        // These are not in JWT claims, so we need to query database
        User user = userRepository.findByEmail(email).orElse(null);
        
        UUID userId = null;
        String firstName = null;
        String lastName = null;
        
        if (user != null) {
            userId = user.getId();
            firstName = user.getFirstName();
            lastName = user.getLastName();
        } else {
            log.warn("User not found in database for email: {}", email);
            // Continue with JWT data only - user might have been deleted but token still valid
        }
        
        // Remove duplicate permissions using LinkedHashSet to preserve order
        List<String> uniquePermissions = permissions != null 
            ? new java.util.ArrayList<>(new java.util.LinkedHashSet<>(permissions))
            : List.of();
        
        // Build response from JWT claims (primary source) + minimal DB data
        return CurrentUserResponse.builder()
                .id(userId)
                .email(email)
                .firstName(firstName)
                .lastName(lastName)
                .tenantId(tenantId)
                .roles(roles != null ? roles : List.of())
                .permissions(uniquePermissions)
                .isImpersonation(isImpersonation)
                .impersonatedEmail(impersonatedEmail)
                .originalUserId(originalUserId)
                .originalEmail(originalEmail)
                .build();
    }
}
