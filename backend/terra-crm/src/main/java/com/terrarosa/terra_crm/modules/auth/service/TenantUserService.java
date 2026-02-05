package com.terrarosa.terra_crm.modules.auth.service;

import com.terrarosa.terra_crm.core.audit.annotation.AuditLog;
import com.terrarosa.terra_crm.core.quota.service.QuotaService;
import com.terrarosa.terra_crm.core.security.util.RandomPasswordGenerator;
import com.terrarosa.terra_crm.core.tenancy.entity.Tenant;
import com.terrarosa.terra_crm.core.tenancy.repository.TenantRepository;
import com.terrarosa.terra_crm.modules.auth.dto.PasswordResetResponse;
import com.terrarosa.terra_crm.modules.auth.dto.TenantUserCreateRequest;
import com.terrarosa.terra_crm.modules.auth.dto.TenantUserCreateResponse;
import com.terrarosa.terra_crm.modules.auth.entity.PermissionBundle;
import com.terrarosa.terra_crm.modules.auth.entity.Role;
import com.terrarosa.terra_crm.modules.auth.entity.User;
import com.terrarosa.terra_crm.modules.auth.repository.PermissionBundleRepository;
import com.terrarosa.terra_crm.modules.auth.repository.RefreshTokenRepository;
import com.terrarosa.terra_crm.modules.auth.repository.RoleRepository;
import com.terrarosa.terra_crm.modules.auth.repository.UserRepository;
import com.terrarosa.terra_crm.modules.auth.dto.UserProfileDto;
import com.terrarosa.terra_crm.modules.auth.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for tenant-scoped user management operations initiated by tenant
 * admins.
 *
 * <p>
 * Responsibilities:
 * <ul>
 * <li>Create new users for a tenant with system-generated secure passwords</li>
 * <li>Assign a single permission bundle to the user (optional)</li>
 * <li>Reset user passwords and revoke their refresh tokens</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TenantUserService {

        private static final int DEFAULT_PASSWORD_LENGTH = 16;

        private final UserRepository userRepository;
        private final TenantRepository tenantRepository;
        private final RoleRepository roleRepository;
        private final PermissionBundleRepository permissionBundleRepository;
        private final PermissionService permissionService;
        private final PasswordEncoder passwordEncoder;
        private final QuotaService quotaService;
        private final RefreshTokenRepository refreshTokenRepository;
        private final UserProfileService userProfileService;

        /**
         * Update an existing user in the given tenant.
         *
         * @param tenantId the tenant ID resolved from context
         * @param userId   the user to update
         * @param request  the update request containing new names/email/bundle
         */
        @AuditLog(action = "TENANT_USER_UPDATED", resourceType = "USER")
        @Transactional
        public void updateTenantUser(UUID tenantId, UUID userId, TenantUserCreateRequest request) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

                // Security check: ensure user belongs to tenant
                if (!user.getTenant().getId().equals(tenantId)) {
                        throw new IllegalArgumentException("User does not belong to current tenant");
                }

                if (request.getFirstName() != null)
                        user.setFirstName(request.getFirstName());
                if (request.getLastName() != null)
                        user.setLastName(request.getLastName());

                if (request.getEmail() != null) {
                        String email = normalizeEmail(request.getEmail());
                        Tenant tenant = user.getTenant();

                        // Enforce domain restriction
                        if (tenant.getDomain() != null && !email.endsWith("@" + tenant.getDomain())) {
                                throw new IllegalArgumentException("Email must end with @" + tenant.getDomain());
                        }

                        // Check uniqueness if email changed
                        if (!user.getEmail().equalsIgnoreCase(email)
                                        && userRepository.existsByEmailAndNotDeleted(email)) {
                                throw new IllegalArgumentException("User with this email already exists");
                        }
                        user.setEmail(email);
                }

                userRepository.save(user);

                // Update bundle assignment if provided
                if (request.getBundleId() != null) {
                        PermissionBundle bundle = permissionBundleRepository.findById(request.getBundleId())
                                        .orElseThrow(() -> new IllegalArgumentException(
                                                        "Bundle not found with id: " + request.getBundleId()));

                        if (!bundle.getTenant().getId().equals(tenantId)) {
                                throw new IllegalArgumentException("Bundle does not belong to current tenant");
                        }

                        // Remove existing bundles first? Or just add?
                        // In most cases, we replace local permissions for simplicity
                        permissionService.assignBundleToUser(userId, request.getBundleId());
                }
        }

        /**
         * Create a new user for the given tenant with an auto-generated password.
         *
         * @param tenantId the tenant ID resolved from the authenticated context
         * @param request  user creation request
         * @return response containing created user info and generated password
         */
        @AuditLog(action = "TENANT_USER_CREATED", resourceType = "USER")
        @Transactional
        public TenantUserCreateResponse createUserForTenant(UUID tenantId, TenantUserCreateRequest request) {
                String email = normalizeEmail(request.getEmail());

                Tenant tenant = tenantRepository.findById(tenantId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Tenant not found with id: " + tenantId));

                // Enforce domain restriction if tenant has a configured domain
                if (tenant.getDomain() != null && !email.endsWith("@" + tenant.getDomain())) {
                        throw new IllegalArgumentException("Email must end with @" + tenant.getDomain());
                }

                // Check if user already exists (excluding deleted)
                if (userRepository.existsByEmailAndNotDeleted(email)) {
                        throw new IllegalArgumentException("User with this email already exists");
                }

                // Quota enforcement for number of users
                long userCount = userRepository.countByTenantId(tenantId);
                quotaService.validateQuota(tenantId, "users", userCount);

                // Generate secure random password
                String rawPassword = RandomPasswordGenerator.generateSecurePassword(DEFAULT_PASSWORD_LENGTH);
                String encodedPassword = passwordEncoder.encode(rawPassword);

                // Default role is ROLE_AGENT for tenant-created users
                Role agentRole = roleRepository.findByName("ROLE_AGENT")
                                .orElseThrow(() -> new IllegalStateException(
                                                "Default role ROLE_AGENT not found. Run migrations."));

                User user = User.builder()
                                .firstName(request.getFirstName())
                                .lastName(request.getLastName())
                                .email(email)
                                .password(encodedPassword)
                                .tenant(tenant)
                                .enabled(true)
                                .build();
                user.getRoles().add(agentRole);

                User savedUser = userRepository.save(user);

                // Create user profile in tenant schema
                UserProfileDto profileDto = UserProfileDto.builder()
                                .userId(savedUser.getId())
                                .tcNo(request.getTcNo())
                                .birthDate(request.getBirthDate())
                                .address(request.getAddress())
                                .emergencyPerson(request.getEmergencyPerson())
                                .emergencyPhone(request.getEmergencyPhone())
                                .phoneNumber(request.getPhoneNumber())
                                .personalEmail(request.getPersonalEmail())
                                .build();
                userProfileService.upsertProfile(savedUser.getId(), profileDto);

                UUID bundleId = request.getBundleId();
                String bundleName = null;

                if (bundleId != null) {
                        PermissionBundle bundle = permissionBundleRepository.findById(bundleId)
                                        .orElseThrow(() -> new IllegalArgumentException(
                                                        "Bundle not found with id: " + bundleId));

                        if (!bundle.getTenant().getId().equals(tenantId)) {
                                throw new IllegalArgumentException("Bundle does not belong to current tenant");
                        }

                        permissionService.assignBundleToUser(savedUser.getId(), bundleId);
                        bundleName = bundle.getName();
                }

                log.info("Created tenant user {} for tenant {}", email, tenant.getName());

                return TenantUserCreateResponse.builder()
                                .id(savedUser.getId())
                                .email(savedUser.getEmail())
                                .firstName(savedUser.getFirstName())
                                .lastName(savedUser.getLastName())
                                .tenantId(tenant.getId())
                                .bundleId(bundleId)
                                .bundleName(bundleName)
                                .generatedPassword(rawPassword)
                                .build();
        }

        /**
         * Reset a user's password for the given tenant.
         *
         * <p>
         * Tenant membership is validated at controller layer using
         * {@code TenantSecurityService.validateUserActiveAndBelongsToTenant}.
         *
         * @param userId user ID
         * @return response containing the new generated password
         */
        @AuditLog(action = "PASSWORD_RESET", resourceType = "USER")
        @Transactional
        public PasswordResetResponse resetUserPassword(UUID userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

                String rawPassword = RandomPasswordGenerator.generateSecurePassword(DEFAULT_PASSWORD_LENGTH);
                String encodedPassword = passwordEncoder.encode(rawPassword);

                user.setPassword(encodedPassword);
                userRepository.save(user);

                // Revoke all refresh tokens so that the user must log in again with the new
                // password
                refreshTokenRepository.revokeAllUserTokens(userId, LocalDateTime.now());

                log.info("Reset password for user {}", user.getEmail());

                return PasswordResetResponse.builder()
                                .userId(user.getId())
                                .generatedPassword(rawPassword)
                                .build();
        }

        private String normalizeEmail(String email) {
                return Optional.ofNullable(email)
                                .map(e -> e.toLowerCase().trim())
                                .orElseThrow(() -> new IllegalArgumentException("Email is required"));
        }
}
