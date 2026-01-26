package com.terrarosa.terra_crm.modules.auth.repository;

import com.terrarosa.terra_crm.core.common.repository.SoftDeleteRepository;
import com.terrarosa.terra_crm.modules.auth.entity.SuperAdmin;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SuperAdminRepository extends SoftDeleteRepository<SuperAdmin, UUID> {
    
    @Query("SELECT sa FROM SuperAdmin sa WHERE sa.user.id = :userId")
    Optional<SuperAdmin> findByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT COUNT(sa) > 0 FROM SuperAdmin sa WHERE sa.user.id = :userId")
    boolean existsByUserId(@Param("userId") UUID userId);
    
    @Query("DELETE FROM SuperAdmin sa WHERE sa.user.id = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
