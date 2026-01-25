package com.terrarosa.terra_crm.modules.auth.entity;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

/**
 * Composite key class for UserPermission entity.
 */
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class UserPermissionId implements Serializable {
    
    private UUID user;
    private UUID permission;
}
