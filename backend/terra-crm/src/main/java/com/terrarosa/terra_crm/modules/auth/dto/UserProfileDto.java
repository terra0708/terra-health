package com.terrarosa.terra_crm.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for tenant-specific user profile information.
 * Ortak kullanıcı profil yapısı; auth modülünde tutulur.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {

    private UUID userId;
    private String tcNo;
    private LocalDate birthDate;
    private String address;
    private String emergencyPerson;
    private String emergencyPhone;
    private String phoneNumber;
    private String personalEmail;
}
