package com.terrarosa.terra_crm.modules.health.repository;

import com.terrarosa.terra_crm.core.common.repository.SoftDeleteRepository;
import com.terrarosa.terra_crm.modules.health.entity.Customer;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CustomerRepository extends SoftDeleteRepository<Customer, UUID> {
}
