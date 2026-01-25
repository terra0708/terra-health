package com.terrarosa.terra_crm.modules.auth.repository;

import com.terrarosa.terra_crm.core.common.repository.SoftDeleteRepository;
import com.terrarosa.terra_crm.modules.auth.entity.Permission;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PermissionRepository extends SoftDeleteRepository<Permission, UUID> {
    
    Optional<Permission> findByName(String name);
    
    List<Permission> findByType(Permission.PermissionType type);
    
    List<Permission> findByParentPermissionId(UUID parentPermissionId);
    
    List<Permission> findByParentPermission(Permission parentPermission);
}
