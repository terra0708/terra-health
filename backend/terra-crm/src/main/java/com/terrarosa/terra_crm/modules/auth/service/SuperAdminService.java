package com.terrarosa.terra_crm.modules.auth.service;

import com.terrarosa.terra_crm.modules.auth.entity.SuperAdmin;
import com.terrarosa.terra_crm.modules.auth.entity.User;
import com.terrarosa.terra_crm.modules.auth.repository.SuperAdminRepository;
import com.terrarosa.terra_crm.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

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
                .userId(userId)
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
}
