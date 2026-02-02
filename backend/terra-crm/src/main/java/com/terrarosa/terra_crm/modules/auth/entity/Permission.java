package com.terrarosa.terra_crm.modules.auth.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.terrarosa.terra_crm.core.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

@Entity
@Table(name = "permissions", schema = "public")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Permission extends BaseEntity {
    
    @Column(nullable = false, unique = true)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PermissionType type;
    
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_permission_id")
    private Permission parentPermission;
    
    @JsonIgnore
    @OneToMany(mappedBy = "parentPermission", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<Permission> childPermissions = new HashSet<>();
    
    @JsonIgnore
    @OneToMany(mappedBy = "permission", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<com.terrarosa.terra_crm.modules.auth.entity.TenantModule> tenants = new HashSet<>();
    
    @JsonIgnore
    @OneToMany(mappedBy = "permission", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<com.terrarosa.terra_crm.modules.auth.entity.UserPermission> users = new HashSet<>();
    
    @JsonIgnore
    @ManyToMany(mappedBy = "permissions", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<PermissionBundle> bundles = new HashSet<>();
    
    // Manual equals and hashCode - only based on id to avoid circular references
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Permission that = (Permission) o;
        return Objects.equals(getId(), that.getId());
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(getId());
    }
    
    public enum PermissionType {
        MODULE,
        ACTION
    }
}
