package com.terrarosa.terra_crm.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Request DTO for creating a new user within a tenant by a tenant admin.
 *
 * <p>
 * IMPORTANT:
 * <ul>
 * <li>Password is NOT provided by the client. It is generated server-side.</li>
 * <li>Tenant information is resolved from the authenticated context, not from
 * this DTO.</li>
 * </ul>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TenantUserCreateRequest {

    private String firstName;
    private String lastName;
    private String email;

    /**
     * Optional permission bundle ID to assign to the user after creation.
     */
    private UUID bundleId;

    // Profile fields
    private String tcNo;
    private LocalDate birthDate;
    private String address;
    private String emergencyPerson;
    private String emergencyPhone;
    private String phoneNumber;
    private String personalEmail;
}
