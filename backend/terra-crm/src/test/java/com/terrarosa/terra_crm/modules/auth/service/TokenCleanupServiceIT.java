package com.terrarosa.terra_crm.modules.auth.service;

import com.terrarosa.terra_crm.core.tenancy.entity.Tenant;
import com.terrarosa.terra_crm.core.tenancy.repository.TenantRepository;
import com.terrarosa.terra_crm.modules.auth.entity.RefreshToken;
import com.terrarosa.terra_crm.modules.auth.entity.User;
import com.terrarosa.terra_crm.modules.auth.repository.RefreshTokenRepository;
import com.terrarosa.terra_crm.modules.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Integration test for TokenCleanupService.
 * Tests the cleanup of expired and revoked refresh tokens.
 */
@SpringBootTest
@ActiveProfiles("test")
class TokenCleanupServiceIT {
    
    @Autowired
    private TokenCleanupService tokenCleanupService;
    
    @Autowired
    private RefreshTokenRepository refreshTokenRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TenantRepository tenantRepository;
    
    private User testUser;
    private Tenant testTenant;
    
    @BeforeEach
    void setUp() {
        // Clean up database before each test to avoid conflicts with existing data
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
        
        // Create test tenant
        testTenant = Tenant.builder()
                .name("Test Tenant")
                .schemaName("test_tenant_" + UUID.randomUUID().toString().replace("-", ""))
                .build();
        testTenant = tenantRepository.save(testTenant);
        
        // Create test user
        testUser = User.builder()
                .email("test@example.com")
                .password("encodedPassword")
                .firstName("Test")
                .lastName("User")
                .tenant(testTenant)
                .enabled(true)
                .build();
        testUser = userRepository.save(testUser);
    }
    
    @Test
    void testCleanupExpiredAndRevokedTokens() {
        // Setup: Create 3 different types of tokens
        LocalDateTime now = LocalDateTime.now();
        
        // 1. Expired token (expiresAt < now)
        RefreshToken expiredToken = RefreshToken.builder()
                .user(testUser)
                .token("expired-token-" + UUID.randomUUID())
                .expiresAt(now.minusDays(1)) // Expired 1 day ago
                .revoked(false)
                .build();
        expiredToken = refreshTokenRepository.save(expiredToken);
        UUID expiredTokenId = expiredToken.getId();
        
        // 2. Revoked but not expired token (revoked = true, expiresAt > now)
        RefreshToken revokedToken = RefreshToken.builder()
                .user(testUser)
                .token("revoked-token-" + UUID.randomUUID())
                .expiresAt(now.plusDays(7)) // Expires in 7 days
                .revoked(true)
                .revokedAt(now.minusHours(1))
                .build();
        revokedToken = refreshTokenRepository.save(revokedToken);
        UUID revokedTokenId = revokedToken.getId();
        
        // 3. Valid token (revoked = false, expiresAt > now)
        RefreshToken validToken = RefreshToken.builder()
                .user(testUser)
                .token("valid-token-" + UUID.randomUUID())
                .expiresAt(now.plusDays(7)) // Expires in 7 days
                .revoked(false)
                .build();
        validToken = refreshTokenRepository.save(validToken);
        UUID validTokenId = validToken.getId();
        
        // Verify all 3 tokens are saved
        List<RefreshToken> allTokensBefore = refreshTokenRepository.findAll();
        assertEquals(3, allTokensBefore.size(), "Should have 3 tokens before cleanup");
        
        // Execution: Call cleanup method
        tokenCleanupService.cleanupExpiredAndRevokedTokens();
        
        // Verification: Only 1 token (valid one) should remain
        List<RefreshToken> allTokensAfter = refreshTokenRepository.findAll();
        assertEquals(1, allTokensAfter.size(), "Should have only 1 token after cleanup");
        
        // Verify the remaining token is the valid one
        RefreshToken remainingToken = allTokensAfter.get(0);
        assertEquals(validTokenId, remainingToken.getId(), "Remaining token should be the valid one");
        assertFalse(remainingToken.getRevoked(), "Remaining token should not be revoked");
        assertTrue(remainingToken.getExpiresAt().isAfter(now), "Remaining token should not be expired");
        
        // Verify hard delete: Check that expired and revoked tokens are physically deleted
        assertFalse(refreshTokenRepository.findById(expiredTokenId).isPresent(), 
                "Expired token should be physically deleted (hard delete)");
        assertFalse(refreshTokenRepository.findById(revokedTokenId).isPresent(), 
                "Revoked token should be physically deleted (hard delete)");
        assertTrue(refreshTokenRepository.findById(validTokenId).isPresent(), 
                "Valid token should still exist");
    }
}
