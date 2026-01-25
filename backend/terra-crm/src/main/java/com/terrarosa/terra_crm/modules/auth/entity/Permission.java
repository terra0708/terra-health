package com.terrarosa.terra_crm.modules.auth.entity;

import com.terrarosa.terra_crm.core.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "permissions", schema = "public")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, exclude = {"parentPermission", "childPermissions", "tenants", "users", "bundles"})
@ToString(exclude = {"parentPermission", "childPermissions", "tenants", "users", "bundles"})
public class Permission extends BaseEntity {
    
    @Column(nullable = false, unique = true)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PermissionType type;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_permission_id")
    private Permission parentPermission;
    
    @OneToMany(mappedBy = "parentPermission", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<Permission> childPermissions = new HashSet<>();
    
    @ManyToMany(mappedBy = "permission", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<com.terrarosa.terra_crm.modules.auth.entity.TenantModule> tenants = new HashSet<>();
    
    @ManyToMany(mappedBy = "permission", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<com.terrarosa.terra_crm.modules.auth.entity.UserPermission> users = new HashSet<>();
    
    @ManyToMany(mappedBy = "permissions", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<PermissionBundle> bundles = new HashSet<>();
    
    public enum PermissionType {
        MODULE,
        ACTION
    }
}
