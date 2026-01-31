package com.terrarosa.terra_crm.modules.auth.dto;

import com.terrarosa.terra_crm.modules.auth.entity.Permission;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO for permission response.
 * Includes UUID, name, description, type, and parent permission information.
 * Used to transfer permission data to frontend with full hierarchy information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionResponseDTO {
    private UUID id;
    private String name;
    private String description;
    private Permission.PermissionType type;
    
    /**
     * Parent MODULE permission ID (null for MODULE permissions).
     * Used for grouping ACTION permissions under their parent MODULE.
     */
    private UUID parentPermissionId;
    
    /**
     * Parent MODULE permission name (null for MODULE permissions).
     * Used for display purposes in frontend.
     */
    private String parentPermissionName;
}
