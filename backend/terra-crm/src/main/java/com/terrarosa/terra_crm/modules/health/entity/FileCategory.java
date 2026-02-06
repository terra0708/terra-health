package com.terrarosa.terra_crm.modules.health.entity;

import com.terrarosa.terra_crm.core.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "file_categories")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileCategory extends BaseEntity {

    @Column(name = "label_tr", nullable = false, length = 255)
    private String labelTr;

    @Column(name = "label_en", nullable = false, length = 255)
    private String labelEn;

    @Column(length = 7)
    @lombok.Builder.Default
    private String color = "#6366f1";

    @Column(length = 50)
    private String icon;

    @Column(name = "is_system_default")
    @lombok.Builder.Default
    private Boolean isSystemDefault = false;

    @Column(name = "is_deletable")
    @lombok.Builder.Default
    private Boolean isDeletable = true;
}
