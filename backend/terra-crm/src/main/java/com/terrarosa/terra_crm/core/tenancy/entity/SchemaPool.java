package com.terrarosa.terra_crm.core.tenancy.entity;

import com.terrarosa.terra_crm.core.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing a schema in the schema pool.
 * Schemas are pre-provisioned and ready for assignment to new tenants.
 */
@Entity
@Table(name = "schema_pool", schema = "public")
@Getter
@Setter
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchemaPool extends BaseEntity {
    
    /**
     * Schema name with tp_ prefix (e.g., tp_a7b2c9d1).
     * Must be unique across all schemas.
     */
    @Column(name = "schema_name", nullable = false, unique = true, length = 63)
    @Pattern(regexp = "^tp_[a-z0-9]{8,}$", message = "Schema name must start with 'tp_' followed by at least 8 alphanumeric characters")
    private String schemaName;
    
    /**
     * Current status of the schema in the pool.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @NotNull
    @Builder.Default
    private SchemaPoolStatus status = SchemaPoolStatus.READY;
    
    /**
     * Timestamp when the schema was assigned to a tenant.
     * Null if the schema has never been assigned.
     */
    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;
}
