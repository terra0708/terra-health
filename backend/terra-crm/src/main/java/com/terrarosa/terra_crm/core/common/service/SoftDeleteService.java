package com.terrarosa.terra_crm.core.common.service;

import com.terrarosa.terra_crm.core.common.entity.BaseEntity;
import com.terrarosa.terra_crm.core.common.repository.SoftDeleteRepository;
import com.terrarosa.terra_crm.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service for handling soft delete operations with unique field suffixing.
 * Handles the critical issue of unique constraint violations when soft deleting.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SoftDeleteService {
    
    private final UserRepository userRepository;
    
    /**
     * Get current authenticated user ID from security context.
     */
    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            log.warn("No authenticated user found in security context");
            return null;
        }
        
        try {
            String email = auth.getName();
            return userRepository.findByEmail(email)
                    .map(com.terrarosa.terra_crm.modules.auth.entity.User::getId)
                    .orElse(null);
        } catch (Exception e) {
            log.warn("Failed to get current user ID: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Soft delete an entity, handling unique field suffixing if needed.
     * For entities with unique fields (e.g., User.email), appends _deleted_{timestamp} suffix.
     * Records who deleted the entity in deletedBy field.
     */
    @Transactional
    public <T extends BaseEntity> void softDelete(T entity, SoftDeleteRepository<T, UUID> repository) {
        // Handle unique field suffixing for specific entity types
        handleUniqueFieldSuffixing(entity);
        
        // Get current user ID for audit trail
        UUID deletedBy = getCurrentUserId();
        
        // Perform soft delete
        entity.setDeleted(true);
        entity.setDeletedAt(LocalDateTime.now());
        entity.setDeletedBy(deletedBy);
        repository.save(entity);
        
        log.info("Soft deleted entity: {} with id: {} by user: {}", 
            entity.getClass().getSimpleName(), entity.getId(), deletedBy);
    }
    
    /**
     * Soft delete by ID.
     */
    @Transactional
    public <T extends BaseEntity> void softDeleteById(UUID id, SoftDeleteRepository<T, UUID> repository) {
        T entity = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Entity not found with id: " + id));
        softDelete(entity, repository);
    }
    
    /**
     * Restore a soft-deleted entity, removing unique field suffix if present.
     * CRITICAL: Validates that restored unique field values (e.g., email) don't conflict
     * with existing active records.
     */
    @Transactional
    public <T extends BaseEntity> void restore(T entity, SoftDeleteRepository<T, UUID> repository) {
        // Restore unique field values if they were suffixed
        // This also validates for conflicts
        restoreUniqueFieldValues(entity, repository);
        
        entity.setDeleted(false);
        entity.setDeletedAt(null);
        entity.setDeletedBy(null); // Clear deletedBy on restore
        repository.save(entity);
        
        log.info("Restored entity: {} with id: {}", entity.getClass().getSimpleName(), entity.getId());
    }
    
    /**
     * Restore by ID.
     */
    @Transactional
    public <T extends BaseEntity> void restoreById(UUID id, SoftDeleteRepository<T, UUID> repository) {
        T entity = repository.findByIdIncludingDeleted(id)
                .orElseThrow(() -> new IllegalArgumentException("Entity not found with id: " + id));
        restore(entity, repository);
    }
    
    /**
     * Find all entities including deleted (trash can).
     * CRITICAL: Only accessible by ROLE_ADMIN.
     */
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Transactional(readOnly = true)
    public <T extends BaseEntity> List<T> findAllIncludingDeleted(SoftDeleteRepository<T, UUID> repository) {
        return repository.findAllIncludingDeleted();
    }
    
    /**
     * Find entity by ID including deleted.
     * CRITICAL: Only accessible by ROLE_ADMIN.
     */
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Transactional(readOnly = true)
    public <T extends BaseEntity> T findByIdIncludingDeleted(UUID id, SoftDeleteRepository<T, UUID> repository) {
        return repository.findByIdIncludingDeleted(id)
                .orElseThrow(() -> new IllegalArgumentException("Entity not found with id: " + id));
    }
    
    /**
     * Handle unique field suffixing for entities with unique constraints.
     * Appends _deleted_{timestamp} to unique fields to prevent constraint violations.
     */
    private <T extends BaseEntity> void handleUniqueFieldSuffixing(T entity) {
        long timestamp = System.currentTimeMillis();
        String suffix = "_deleted_" + timestamp;
        
        // Handle User entity - email is unique
        if (entity instanceof com.terrarosa.terra_crm.modules.auth.entity.User) {
            com.terrarosa.terra_crm.modules.auth.entity.User user = (com.terrarosa.terra_crm.modules.auth.entity.User) entity;
            String originalEmail = user.getEmail();
            // Only suffix if not already suffixed
            if (!originalEmail.contains("_deleted_")) {
                user.setEmail(originalEmail + suffix);
                log.debug("Suffixed email for soft delete: {} -> {}", originalEmail, user.getEmail());
            }
        }
        
        // Handle Role entity - name is unique
        if (entity instanceof com.terrarosa.terra_crm.modules.auth.entity.Role) {
            com.terrarosa.terra_crm.modules.auth.entity.Role role = (com.terrarosa.terra_crm.modules.auth.entity.Role) entity;
            String originalName = role.getName();
            if (!originalName.contains("_deleted_")) {
                role.setName(originalName + suffix);
                log.debug("Suffixed role name for soft delete: {} -> {}", originalName, role.getName());
            }
        }
        
        // Handle Tenant entity - schema_name is unique
        if (entity instanceof com.terrarosa.terra_crm.core.tenancy.entity.Tenant) {
            com.terrarosa.terra_crm.core.tenancy.entity.Tenant tenant = (com.terrarosa.terra_crm.core.tenancy.entity.Tenant) entity;
            String originalSchemaName = tenant.getSchemaName();
            if (!originalSchemaName.contains("_deleted_")) {
                tenant.setSchemaName(originalSchemaName + suffix);
                log.debug("Suffixed schema_name for soft delete: {} -> {}", originalSchemaName, tenant.getSchemaName());
            }
        }
        
        // Handle Permission entity - name is unique
        if (entity instanceof com.terrarosa.terra_crm.modules.auth.entity.Permission) {
            com.terrarosa.terra_crm.modules.auth.entity.Permission permission = (com.terrarosa.terra_crm.modules.auth.entity.Permission) entity;
            String originalName = permission.getName();
            if (!originalName.contains("_deleted_")) {
                permission.setName(originalName + suffix);
                log.debug("Suffixed permission name for soft delete: {} -> {}", originalName, permission.getName());
            }
        }
    }
    
    /**
     * Restore original unique field values by removing _deleted_ suffix.
     * CRITICAL: Validates that restored values don't conflict with existing active records.
     */
    private <T extends BaseEntity> void restoreUniqueFieldValues(T entity, SoftDeleteRepository<T, UUID> repository) {
        // Handle User entity - email conflict check
        if (entity instanceof com.terrarosa.terra_crm.modules.auth.entity.User) {
            com.terrarosa.terra_crm.modules.auth.entity.User user = (com.terrarosa.terra_crm.modules.auth.entity.User) entity;
            String email = user.getEmail();
            if (email.contains("_deleted_")) {
                String originalEmail = email.replaceAll("_deleted_\\d+$", "");
                
                // CRITICAL: Check if another active user with this email exists
                if (userRepository.existsByEmailAndNotDeleted(originalEmail)) {
                    throw new IllegalArgumentException(
                        String.format("Cannot restore user: Email '%s' is already in use by another active user", originalEmail)
                    );
                }
                
                user.setEmail(originalEmail);
                log.debug("Restored email: {} -> {}", email, originalEmail);
            }
        }
        
        // Handle Role entity - name conflict check
        if (entity instanceof com.terrarosa.terra_crm.modules.auth.entity.Role) {
            com.terrarosa.terra_crm.modules.auth.entity.Role role = (com.terrarosa.terra_crm.modules.auth.entity.Role) entity;
            String name = role.getName();
            if (name.contains("_deleted_")) {
                String originalName = name.replaceAll("_deleted_\\d+$", "");
                
                // Check if another active role with this name exists
                // Note: We use repository.findAll() to check for conflicts since we can't safely cast
                // In production, you might want to inject specific repositories or use a different approach
                List<T> allEntities = repository.findAll();
                boolean conflict = allEntities.stream()
                    .filter(e -> e instanceof com.terrarosa.terra_crm.modules.auth.entity.Role)
                    .map(e -> (com.terrarosa.terra_crm.modules.auth.entity.Role) e)
                    .anyMatch(r -> !r.getId().equals(role.getId()) 
                        && !r.getDeleted() 
                        && r.getName().equals(originalName));
                
                if (conflict) {
                    throw new IllegalArgumentException(
                        String.format("Cannot restore role: Name '%s' is already in use by another active role", originalName)
                    );
                }
                
                role.setName(originalName);
                log.debug("Restored role name: {} -> {}", name, originalName);
            }
        }
        
        // Handle Tenant entity - schema_name conflict check
        if (entity instanceof com.terrarosa.terra_crm.core.tenancy.entity.Tenant) {
            com.terrarosa.terra_crm.core.tenancy.entity.Tenant tenant = (com.terrarosa.terra_crm.core.tenancy.entity.Tenant) entity;
            String schemaName = tenant.getSchemaName();
            if (schemaName.contains("_deleted_")) {
                String originalSchemaName = schemaName.replaceAll("_deleted_\\d+$", "");
                
                // Check if another active tenant with this schema_name exists
                List<T> allEntities = repository.findAll();
                boolean conflict = allEntities.stream()
                    .filter(e -> e instanceof com.terrarosa.terra_crm.core.tenancy.entity.Tenant)
                    .map(e -> (com.terrarosa.terra_crm.core.tenancy.entity.Tenant) e)
                    .anyMatch(t -> !t.getId().equals(tenant.getId()) 
                        && !t.getDeleted() 
                        && t.getSchemaName().equals(originalSchemaName));
                
                if (conflict) {
                    throw new IllegalArgumentException(
                        String.format("Cannot restore tenant: Schema name '%s' is already in use by another active tenant", originalSchemaName)
                    );
                }
                
                tenant.setSchemaName(originalSchemaName);
                log.debug("Restored schema_name: {} -> {}", schemaName, originalSchemaName);
            }
        }
        
        // Handle Permission entity - name conflict check
        if (entity instanceof com.terrarosa.terra_crm.modules.auth.entity.Permission) {
            com.terrarosa.terra_crm.modules.auth.entity.Permission permission = (com.terrarosa.terra_crm.modules.auth.entity.Permission) entity;
            String name = permission.getName();
            if (name.contains("_deleted_")) {
                String originalName = name.replaceAll("_deleted_\\d+$", "");
                
                // Check if another active permission with this name exists
                List<T> allEntities = repository.findAll();
                boolean conflict = allEntities.stream()
                    .filter(e -> e instanceof com.terrarosa.terra_crm.modules.auth.entity.Permission)
                    .map(e -> (com.terrarosa.terra_crm.modules.auth.entity.Permission) e)
                    .anyMatch(p -> !p.getId().equals(permission.getId()) 
                        && !p.getDeleted() 
                        && p.getName().equals(originalName));
                
                if (conflict) {
                    throw new IllegalArgumentException(
                        String.format("Cannot restore permission: Name '%s' is already in use by another active permission", originalName)
                    );
                }
                
                permission.setName(originalName);
                log.debug("Restored permission name: {} -> {}", name, originalName);
            }
        }
    }
}
