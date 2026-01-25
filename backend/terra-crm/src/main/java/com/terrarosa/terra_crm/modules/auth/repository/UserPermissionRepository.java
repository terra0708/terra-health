package com.terrarosa.terra_crm.modules.auth.repository;

import com.terrarosa.terra_crm.modules.auth.entity.UserPermission;
import com.terrarosa.terra_crm.modules.auth.entity.UserPermissionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserPermissionRepository extends JpaRepository<UserPermission, UserPermissionId> {
    
    List<UserPermission> findByUserId(UUID userId);
    
    Optional<UserPermission> findByUserIdAndPermissionId(UUID userId, UUID permissionId);
    
    void deleteByUserId(UUID userId);
    
    void deleteByUserIdAndPermissionId(UUID userId, UUID permissionId);
}
