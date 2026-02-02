package com.terrarosa.terra_crm.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private UUID tenantId;
    private List<String> roles;
    private List<String> permissions;

    /**
     * Names of permission bundles assigned to the user (if any).
     * This is mainly used by tenant admin UIs to display which bundle
     * a user belongs to.
     */
    private List<String> bundleNames;
}
