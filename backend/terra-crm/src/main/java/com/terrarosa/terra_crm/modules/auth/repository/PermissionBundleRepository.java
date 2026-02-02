package com.terrarosa.terra_crm.modules.auth.repository;

import com.terrarosa.terra_crm.core.common.repository.SoftDeleteRepository;
import com.terrarosa.terra_crm.modules.auth.entity.PermissionBundle;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PermissionBundleRepository extends SoftDeleteRepository<PermissionBundle, UUID> {

    List<PermissionBundle> findByTenantId(UUID tenantId);

    Optional<PermissionBundle> findByNameAndTenantId(String name, UUID tenantId);

    @Query("SELECT b FROM PermissionBundle b JOIN b.users u WHERE u.id = :userId")
    List<PermissionBundle> findByUserId(@Param("userId") UUID userId);

    /** Load bundle with permissions eagerly so assignBundleToUser can copy them to user_permissions. */
    @Query("SELECT b FROM PermissionBundle b LEFT JOIN FETCH b.permissions WHERE b.id = :id")
    Optional<PermissionBundle> findByIdWithPermissions(@Param("id") UUID id);
}
