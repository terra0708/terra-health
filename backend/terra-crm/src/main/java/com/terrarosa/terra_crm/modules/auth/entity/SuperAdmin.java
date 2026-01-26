package com.terrarosa.terra_crm.modules.auth.entity;

import com.terrarosa.terra_crm.core.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Entity representing Super Admin users.
 * 
 * CRITICAL: Uses simple UUID ID instead of shared primary key to avoid Hibernate 7 issues.
 * The user_id is a foreign key with unique constraint, not the primary key.
 */
@Entity
@Table(name = "super_admin_users", schema = "public",
       uniqueConstraints = @UniqueConstraint(name = "uk_super_admin_user_id", columnNames = {"user_id"}))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
@ToString(exclude = {"user"})
@EntityListeners(AuditingEntityListener.class)
public class SuperAdmin extends BaseEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // Manual equals and hashCode - only based on id to avoid circular references
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SuperAdmin that = (SuperAdmin) o;
        return Objects.equals(getId(), that.getId());
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(getId());
    }
}
