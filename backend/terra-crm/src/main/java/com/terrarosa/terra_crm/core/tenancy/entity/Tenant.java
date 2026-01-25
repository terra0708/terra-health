package com.terrarosa.terra_crm.core.tenancy.entity;

import com.terrarosa.terra_crm.core.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tenants", schema = "public")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tenant extends BaseEntity {
    
    @Column(nullable = false)
    private String name;
    
    @Column(name = "schema_name", nullable = false, unique = true)
    private String schemaName;
}
