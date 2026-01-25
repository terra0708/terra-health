package com.terrarosa.terra_crm.core.tenancy.repository;

import com.terrarosa.terra_crm.core.common.repository.SoftDeleteRepository;
import com.terrarosa.terra_crm.core.tenancy.entity.Tenant;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantRepository extends SoftDeleteRepository<Tenant, UUID> {
    
    Optional<Tenant> findBySchemaName(String schemaName);
}
