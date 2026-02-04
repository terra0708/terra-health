package com.terrarosa.terra_crm.modules.health.entity;

import com.terrarosa.terra_crm.core.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "reminder_categories")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReminderCategory extends BaseEntity {

    @Column(name = "label_tr", nullable = false)
    private String labelTr;

    @Column(name = "label_en", nullable = false)
    private String labelEn;

    @Column(name = "icon")
    private String icon;

    @Column(name = "color")
    private String color;

    @Column(name = "is_default")
    private Boolean isDefault;

    @Column(name = "is_system")
    private Boolean isSystem;
}
