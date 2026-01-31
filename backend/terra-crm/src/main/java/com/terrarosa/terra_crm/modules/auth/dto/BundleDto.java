package com.terrarosa.terra_crm.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for permission bundle response.
 * Includes UUID, name, description, tenantId, and eagerly-loaded permissions list.
 * 
 * CRITICAL: The permissions list is always populated (never empty/null) because
 * DTO mapping happens within @Transactional(readOnly = true) context in service layer.
 * This prevents LazyInitializationException.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BundleDto {
    private UUID id;
    private String name;
    private String description;
    private UUID tenantId;
    
    /**
     * List of permissions in this bundle.
     * CRITICAL: Always populated (never empty) - eager loaded in service layer.
     */
    private List<PermissionResponseDTO> permissions;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
