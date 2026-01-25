package com.terrarosa.terra_crm.modules.auth.repository;

import com.terrarosa.terra_crm.modules.auth.entity.TenantModule;
import com.terrarosa.terra_crm.modules.auth.entity.TenantModuleId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TenantModuleRepository extends JpaRepository<TenantModule, TenantModuleId> {
    
    List<TenantModule> findByTenantId(UUID tenantId);
    
    boolean existsByTenantIdAndPermissionId(UUID tenantId, UUID permissionId);
    
    void deleteByTenantIdAndPermissionId(UUID tenantId, UUID permissionId);
}
