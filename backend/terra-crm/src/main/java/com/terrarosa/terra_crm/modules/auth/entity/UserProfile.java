package com.terrarosa.terra_crm.modules.auth.entity;

import com.terrarosa.terra_crm.core.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Tenant-specific user profile entity.
 *
 * <p>Auth kimliği (email, şifre hash'i, first/last name, roller) public.users
 * tablosunda tutulur. Bu entity ise yalnızca tenant şemasındaki kişisel
 * profil alanlarını içerir. Ortak yapı olduğu için auth modülündedir.
 */
@Entity
@Table(name = "user_profiles")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfile extends BaseEntity {

    /**
     * Reference to the auth User (public.users.id).
     * We store only the UUID here to avoid cross-schema ORM mapping issues.
     */
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "tc_no", length = 50)
    private String tcNo;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "address")
    private String address;

    @Column(name = "emergency_person", length = 255)
    private String emergencyPerson;

    @Column(name = "emergency_phone", length = 50)
    private String emergencyPhone;

    @Column(name = "phone_number", length = 50)
    private String phoneNumber;

    @Column(name = "personal_email", length = 255)
    private String personalEmail;
}
