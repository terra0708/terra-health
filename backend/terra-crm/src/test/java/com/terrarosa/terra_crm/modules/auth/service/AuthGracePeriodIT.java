package com.terrarosa.terra_crm.modules.auth.service;

import com.terrarosa.terra_crm.core.security.service.JwtService;
import com.terrarosa.terra_crm.core.tenancy.entity.Tenant;
import com.terrarosa.terra_crm.core.tenancy.repository.TenantRepository;
import com.terrarosa.terra_crm.modules.auth.dto.RefreshTokenResponse;
import com.terrarosa.terra_crm.modules.auth.entity.RefreshToken;
import com.terrarosa.terra_crm.modules.auth.entity.User;
import com.terrarosa.terra_crm.modules.auth.repository.RefreshTokenRepository;
import com.terrarosa.terra_crm.modules.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test for AuthService refresh token grace period functionality.
 * Tests normal rotation, grace period success, and reuse attack scenarios.
 */
@SpringBootTest
@ActiveProfiles("test")
class AuthGracePeriodIT {
    
    @Autowired
    private AuthService authService;
    
    @Autowired
    private RefreshTokenRepository refreshTokenRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TenantRepository tenantRepository;
    
    @Autowired
    private JwtService jwtService;
    
    private User testUser;
    private Tenant testTenant;
    
    @BeforeEach
    void setUp() {
        // Clean up database before each test
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
    void testNormalTokenRotation() {
        // Setup: Create a valid refresh token
        String tokenId = UUID.randomUUID().toString();
        String refreshTokenString = jwtService.generateRefreshToken(testUser.getEmail(), tokenId);
        
        RefreshToken refreshToken = RefreshToken.builder()
                .user(testUser)
                .token(refreshTokenString)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();
        refreshToken = refreshTokenRepository.save(refreshToken);
        UUID originalTokenId = refreshToken.getId();
        
        // Execution: Call refreshToken method
        RefreshTokenResponse response = authService.refreshToken(refreshTokenString);
        
        // Verification: Should receive new access token and new refresh token
        assertNotNull(response.getAccessToken(), "Access token should not be null");
        assertNotNull(response.getRefreshToken(), "Refresh token should not be null");
        assertNotNull(response.getExpiresIn(), "ExpiresIn should not be null");
        assertEquals(900000L, response.getExpiresIn(), "ExpiresIn should be 15 minutes");
        
        // Verify old token is revoked in database
        RefreshToken revokedToken = refreshTokenRepository.findById(originalTokenId).orElse(null);
        assertNotNull(revokedToken, "Original token should still exist in database");
        assertTrue(revokedToken.getRevoked(), "Original token should be revoked");
        assertNotNull(revokedToken.getRevokedAt(), "revokedAt should be set");
        
        // Verify new token exists in database
        RefreshToken newToken = refreshTokenRepository.findByToken(response.getRefreshToken()).orElse(null);
        assertNotNull(newToken, "New refresh token should exist in database");
        assertFalse(newToken.getRevoked(), "New token should not be revoked");
    }
    
    @Test
    void testGracePeriodSuccess() {
        // Setup: Create a revoked token with revokedAt 10 seconds ago (within grace period)
        String tokenId = UUID.randomUUID().toString();
        String refreshTokenString = jwtService.generateRefreshToken(testUser.getEmail(), tokenId);
        
        LocalDateTime revokedAt = LocalDateTime.now().minusSeconds(10);
        RefreshToken refreshToken = RefreshToken.builder()
                .user(testUser)
                .token(refreshTokenString)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(true)
                .revokedAt(revokedAt)
                .build();
        refreshToken = refreshTokenRepository.save(refreshToken);
        UUID tokenId_db = refreshToken.getId();
        
        // Execution: Call refreshToken method with revoked token
        RefreshTokenResponse response = authService.refreshToken(refreshTokenString);
        
        // Verification: Should receive new access token but refresh token should be null
        assertNotNull(response.getAccessToken(), "Access token should not be null");
        assertNull(response.getRefreshToken(), "Refresh token should be null (grace period)");
        assertNotNull(response.getExpiresIn(), "ExpiresIn should not be null");
        assertEquals(900000L, response.getExpiresIn(), "ExpiresIn should be 15 minutes");
        
        // Verify token is still revoked (not rotated)
        RefreshToken tokenInDb = refreshTokenRepository.findById(tokenId_db).orElse(null);
        assertNotNull(tokenInDb, "Token should still exist in database");
        assertTrue(tokenInDb.getRevoked(), "Token should remain revoked");
        assertNotNull(tokenInDb.getRevokedAt(), "revokedAt should still be set");
        // Note: We don't check exact equality of revokedAt as it might have slight time differences
    }
    
    @Test
    void testGracePeriodFailure_ReuseAttack() {
        // Setup: Create a revoked token with revokedAt 31 seconds ago (outside grace period)
        String tokenId = UUID.randomUUID().toString();
        String refreshTokenString = jwtService.generateRefreshToken(testUser.getEmail(), tokenId);
        
        LocalDateTime revokedAt = LocalDateTime.now().minusSeconds(31);
        RefreshToken refreshToken = RefreshToken.builder()
                .user(testUser)
                .token(refreshTokenString)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(true)
                .revokedAt(revokedAt)
                .build();
        refreshToken = refreshTokenRepository.save(refreshToken);
        
        // Execution: Call refreshToken method with revoked token (outside grace period)
        BadCredentialsException exception = assertThrows(
                BadCredentialsException.class,
                () -> authService.refreshToken(refreshTokenString),
                "Should throw BadCredentialsException for reuse attack"
        );
        
        // Verification: Should throw exception with revoked message
        assertNotNull(exception.getMessage(), "Exception message should not be null");
        assertTrue(
                exception.getMessage().contains("revoked") || exception.getMessage().contains("Revoked"),
                "Exception message should mention 'revoked'"
        );
    }
}
