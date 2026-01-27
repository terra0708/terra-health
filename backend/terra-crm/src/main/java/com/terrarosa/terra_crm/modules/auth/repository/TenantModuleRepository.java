package com.terrarosa.terra_crm.modules.auth.repository;

import com.terrarosa.terra_crm.core.common.repository.SoftDeleteRepository;
import com.terrarosa.terra_crm.modules.auth.entity.TenantModule;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantModuleRepository extends SoftDeleteRepository<TenantModule, UUID> {

    @Query("SELECT tm FROM TenantModule tm LEFT JOIN FETCH tm.permission WHERE tm.tenant.id = :tenantId")
    List<TenantModule> findByTenantId(@Param("tenantId") UUID tenantId);

    @Query("SELECT COUNT(tm) > 0 FROM TenantModule tm WHERE tm.tenant.id = :tenantId AND tm.permission.id = :permissionId")
    boolean existsByTenantIdAndPermissionId(@Param("tenantId") UUID tenantId, @Param("permissionId") UUID permissionId);

    @Query("SELECT tm FROM TenantModule tm WHERE tm.tenant.id = :tenantId AND tm.permission.id = :permissionId")
    Optional<TenantModule> findByTenantIdAndPermissionId(@Param("tenantId") UUID tenantId,
            @Param("permissionId") UUID permissionId);

    @Modifying
    @Query("DELETE FROM TenantModule tm WHERE tm.tenant.id = :tenantId AND tm.permission.id = :permissionId")
    void deleteByTenantIdAndPermissionId(@Param("tenantId") UUID tenantId, @Param("permissionId") UUID permissionId);

    @Modifying
    @Query("DELETE FROM TenantModule tm WHERE tm.tenant.id = :tenantId")
    void deleteAllByTenantId(@Param("tenantId") UUID tenantId);
}
