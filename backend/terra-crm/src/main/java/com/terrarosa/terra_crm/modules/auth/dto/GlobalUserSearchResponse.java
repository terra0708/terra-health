package com.terrarosa.terra_crm.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for global user search response.
 * Contains list of users with their tenant information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlobalUserSearchResponse {
    
    private List<UserWithTenantDto> users;
    private Integer totalCount;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserWithTenantDto {
        private String userId;
        private String email;
        private String firstName;
        private String lastName;
        private String tenantId;
        private String tenantName;
        private Boolean enabled;
        private List<String> roles;
    }
}
