package com.terrarosa.terra_crm.core.tenancy.entity;

import com.terrarosa.terra_crm.core.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tenants", schema = "public")
@Getter
@Setter
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tenant extends BaseEntity {
    
    @Column(nullable = false)
    private String name;
    
    @Column(name = "schema_name", nullable = false, unique = true)
    private String schemaName;
}
