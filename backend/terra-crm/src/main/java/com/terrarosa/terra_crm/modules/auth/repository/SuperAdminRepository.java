package com.terrarosa.terra_crm.modules.auth.repository;

import com.terrarosa.terra_crm.modules.auth.entity.SuperAdmin;
import com.terrarosa.terra_crm.modules.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SuperAdminRepository extends JpaRepository<SuperAdmin, UUID> {
    
    Optional<SuperAdmin> findByUserId(UUID userId);
    
    boolean existsByUserId(UUID userId);
    
    void deleteByUserId(UUID userId);
}
