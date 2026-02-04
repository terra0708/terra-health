package com.terrarosa.terra_crm.modules.health.entity;

import com.terrarosa.terra_crm.core.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "reminder_statuses")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReminderStatus extends BaseEntity {

    @Column(name = "label_tr", nullable = false)
    private String labelTr;

    @Column(name = "label_en", nullable = false)
    private String labelEn;

    @Column(name = "value", nullable = false)
    private String value;

    @Column(name = "color")
    private String color;

    @Column(name = "is_completed")
    private Boolean isCompleted;

    @Column(name = "is_default")
    private Boolean isDefault;

    @Column(name = "is_system")
    private Boolean isSystem;
}
