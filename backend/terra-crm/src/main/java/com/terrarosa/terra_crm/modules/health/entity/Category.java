package com.terrarosa.terra_crm.modules.health.entity;

import com.terrarosa.terra_crm.core.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "customer_categories")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Category extends BaseEntity {

    @Column(name = "label_tr", nullable = false, length = 100)
    private String labelTr;

    @Column(name = "label_en", nullable = false, length = 100)
    private String labelEn;

    @Column(nullable = false, length = 20)
    private String color;

    @Column(length = 50)
    private String icon;

    @Column(name = "is_system", nullable = false)
    @lombok.Builder.Default
    private Boolean isSystem = false;
}
