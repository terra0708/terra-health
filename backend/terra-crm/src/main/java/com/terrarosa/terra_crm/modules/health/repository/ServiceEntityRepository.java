package com.terrarosa.terra_crm.modules.health.repository;

import com.terrarosa.terra_crm.modules.health.entity.ServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ServiceEntityRepository extends JpaRepository<ServiceEntity, UUID> {
    List<ServiceEntity> findByCategoryId(UUID categoryId);

    Optional<ServiceEntity> findByValue(String value);
}
