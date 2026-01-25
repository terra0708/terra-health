package com.terrarosa.terra_crm.modules.auth.entity;

import com.terrarosa.terra_crm.core.common.entity.BaseEntity;
import com.terrarosa.terra_crm.core.tenancy.entity.Tenant;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "permission_bundles", schema = "public",
       uniqueConstraints = @UniqueConstraint(name = "idx_permission_bundles_tenant_name", 
                                             columnNames = {"tenant_id", "name"}))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, exclude = {"tenant", "permissions", "users"})
@ToString(exclude = {"tenant", "permissions", "users"})
public class PermissionBundle extends BaseEntity {
    
    @Column(nullable = false)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "bundle_permissions",
        schema = "public",
        joinColumns = @JoinColumn(name = "bundle_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    @Builder.Default
    private Set<Permission> permissions = new HashSet<>();
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_bundles",
        schema = "public",
        joinColumns = @JoinColumn(name = "bundle_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default
    private Set<User> users = new HashSet<>();
}
