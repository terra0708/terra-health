package com.terrarosa.terra_crm.modules.auth.repository;

import com.terrarosa.terra_crm.core.common.repository.SoftDeleteRepository;
import com.terrarosa.terra_crm.modules.auth.entity.UserProfile;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserProfileRepository extends SoftDeleteRepository<UserProfile, UUID> {

    Optional<UserProfile> findByUserId(UUID userId);

    List<UserProfile> findByUserIdIn(Collection<UUID> userIds);
}
