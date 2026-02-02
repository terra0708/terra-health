package com.terrarosa.terra_crm.modules.auth.service;

import com.terrarosa.terra_crm.modules.auth.dto.UserProfileDto;
import com.terrarosa.terra_crm.modules.auth.entity.UserProfile;
import com.terrarosa.terra_crm.modules.auth.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Service for managing tenant-specific user profiles.
 *
 * <p>
 * Auth kimliği (email, şifre hash'i, roller) public.users tablosunda tutulur.
 * Bu servis yalnızca tenant şemasındaki user_profiles tablosunu yönetir.
 * Ortak yapı olduğu için auth modülündedir.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;

    /**
     * Get profile for a given user within current tenant schema.
     * Returns an empty DTO if profile does not yet exist.
     */
    @Transactional(readOnly = true)
    public UserProfileDto getProfile(UUID userId) {
        return userProfileRepository.findByUserId(userId)
                .map(this::toDto)
                .orElseGet(() -> UserProfileDto.builder()
                        .userId(userId)
                        .build());
    }

    /**
     * Create or update profile for a given user.
     * Only non-null fields from request are applied (partial update semantics).
     */
    @Transactional
    public UserProfileDto upsertProfile(UUID userId, UserProfileDto request) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseGet(() -> UserProfile.builder()
                        .userId(userId)
                        .build());

        if (request.getTcNo() != null) {
            profile.setTcNo(request.getTcNo());
        }
        if (request.getBirthDate() != null) {
            profile.setBirthDate(request.getBirthDate());
        }
        if (request.getAddress() != null) {
            profile.setAddress(request.getAddress());
        }
        if (request.getEmergencyPerson() != null) {
            profile.setEmergencyPerson(request.getEmergencyPerson());
        }
        if (request.getEmergencyPhone() != null) {
            profile.setEmergencyPhone(request.getEmergencyPhone());
        }
        if (request.getPhoneNumber() != null) {
            profile.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getPersonalEmail() != null) {
            profile.setPersonalEmail(request.getPersonalEmail());
        }

        UserProfile saved = userProfileRepository.save(profile);
        log.debug("Saved user profile for userId={} in tenant schema", userId);
        return toDto(saved);
    }

    private UserProfileDto toDto(UserProfile profile) {
        return UserProfileDto.builder()
                .userId(profile.getUserId())
                .tcNo(profile.getTcNo())
                .birthDate(profile.getBirthDate())
                .address(profile.getAddress())
                .emergencyPerson(profile.getEmergencyPerson())
                .emergencyPhone(profile.getEmergencyPhone())
                .phoneNumber(profile.getPhoneNumber())
                .personalEmail(profile.getPersonalEmail())
                .build();
    }
}
