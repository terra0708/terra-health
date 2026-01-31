package com.terrarosa.terra_crm.modules.auth.dto;

import com.terrarosa.terra_crm.modules.auth.entity.Permission;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTO for MODULE-level permissions.
 * Includes module information and its child ACTION permissions.
 * 
 * CRITICAL: Child permissions are returned as PermissionResponseDTOs which
 * don't include circular parent references, preventing JSON serialization errors.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModuleDTO {
    private UUID id;
    private String name;
    private String description;
    private Permission.PermissionType type;
    
    /**
     * Child ACTION permissions for this module.
     * Each child is a PermissionResponseDTO (no circular references).
     */
    private List<PermissionResponseDTO> childPermissions;
}
