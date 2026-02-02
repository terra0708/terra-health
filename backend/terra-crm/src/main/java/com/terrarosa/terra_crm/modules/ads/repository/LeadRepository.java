package com.terrarosa.terra_crm.modules.ads.repository;

import com.terrarosa.terra_crm.core.common.repository.SoftDeleteRepository;
import com.terrarosa.terra_crm.modules.ads.entity.Lead;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface LeadRepository extends SoftDeleteRepository<Lead, UUID> {
}
