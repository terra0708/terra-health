package com.terrarosa.terra_crm.modules.auth.entity;

import com.terrarosa.terra_crm.core.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * Entity representing refresh tokens stored in database.
 * 
 * CRITICAL: Refresh tokens are stored in database to enable token rotation.
 * When a refresh token is used, it is invalidated and a new one is created.
 * This prevents token reuse attacks.
 */
@Entity
@Table(name = "refresh_tokens", schema = "public",
       indexes = {
           @Index(name = "idx_refresh_tokens_user_id", columnList = "user_id"),
           @Index(name = "idx_refresh_tokens_token", columnList = "token"),
           @Index(name = "idx_refresh_tokens_expires_at", columnList = "expires_at")
       })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class RefreshToken extends BaseEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false, unique = true, length = 500)
    private String token;
    
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
    
    @Column(name = "revoked", nullable = false)
    @Builder.Default
    private Boolean revoked = false;
    
    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;
    
    /**
     * Check if token is expired.
     */
    public boolean isExpired() {
        return expiresAt.isBefore(LocalDateTime.now());
    }
    
    /**
     * Check if token is valid (not expired and not revoked).
     */
    public boolean isValid() {
        return !revoked && !isExpired();
    }
    
    /**
     * Revoke this token.
     */
    public void revoke() {
        this.revoked = true;
        this.revokedAt = LocalDateTime.now();
    }
    
    // Manual equals and hashCode - only based on id to avoid circular references
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        RefreshToken that = (RefreshToken) o;
        return Objects.equals(getId(), that.getId());
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(getId());
    }
}
