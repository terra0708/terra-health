package com.terrarosa.terra_crm.modules.auth.repository;

import com.terrarosa.terra_crm.core.common.repository.SoftDeleteRepository;
import com.terrarosa.terra_crm.modules.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends SoftDeleteRepository<RefreshToken, UUID> {
    
    /**
     * Find refresh token by token string.
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.token = :token AND rt.deleted = false")
    Optional<RefreshToken> findByToken(@Param("token") String token);
    
    /**
     * Find all valid (not revoked, not expired) refresh tokens for a user.
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.user.id = :userId " +
           "AND rt.revoked = false AND rt.expiresAt > :now AND rt.deleted = false")
    java.util.List<RefreshToken> findValidTokensByUserId(@Param("userId") UUID userId, @Param("now") LocalDateTime now);
    
    /**
     * Revoke all refresh tokens for a user (logout).
     */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true, rt.revokedAt = :now " +
           "WHERE rt.user.id = :userId AND rt.revoked = false AND rt.deleted = false")
    void revokeAllUserTokens(@Param("userId") UUID userId, @Param("now") LocalDateTime now);
    
    /**
     * Delete expired tokens (cleanup job).
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now AND rt.deleted = false")
    void deleteExpiredTokens(@Param("now") LocalDateTime now);
}
