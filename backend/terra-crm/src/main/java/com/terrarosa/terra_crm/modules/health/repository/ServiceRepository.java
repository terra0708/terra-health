package com.terrarosa.terra_crm.modules.health.repository;

import com.terrarosa.terra_crm.core.common.repository.SoftDeleteRepository;
import com.terrarosa.terra_crm.modules.health.entity.Service;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ServiceRepository extends SoftDeleteRepository<Service, UUID> {
}
