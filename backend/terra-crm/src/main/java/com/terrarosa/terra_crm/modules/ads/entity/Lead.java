package com.terrarosa.terra_crm.modules.ads.entity;

import com.terrarosa.terra_crm.core.common.entity.BaseEntity;
import com.terrarosa.terra_crm.modules.health.entity.Service;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;
import java.util.UUID;

/**
 * Lead entity for ads / marketing pipeline.
 * Lives in ads module; references health.Service for service offering.
 */
@Entity
@Table(name = "leads")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Lead extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String phone;

    @Column
    private String email;

    @Column(nullable = false)
    private String country;

    @Column(nullable = false)
    private String source; // GOOGLE_ADS, META_ADS, INSTAGRAM_ADS, MANUAL, REFERRAL

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "dynamic_data", columnDefinition = "jsonb")
    private Map<String, Object> dynamicData;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    private Service service;

    @Column(name = "assigned_to")
    private UUID assignedTo;

    @Column(nullable = false)
    private String status;
}
