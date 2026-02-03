package com.terrarosa.terra_crm.modules.health.entity;

import com.terrarosa.terra_crm.core.common.entity.BaseEntity;
import com.terrarosa.terra_crm.modules.ads.entity.Lead;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.Map;

@Entity
@Table(name = "customers")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Customer extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id")
    private Lead lead;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String phone;

    @Column
    private String email;

    @Column(nullable = false)
    private String country;

    @Column
    private String city;

    @Column
    private String job;

    @Column(name = "medical_history", columnDefinition = "TEXT")
    private String medicalHistory;

    @Column(name = "operation_type")
    private String operationType;

    @Column(name = "passport_number")
    private String passportNumber;

    @Column(nullable = false)
    private String status;

    @Column(name = "consultant_id")
    private java.util.UUID consultantId;

    @Column
    private String category;

    @Column
    private String source;

    @Column(name = "registration_date")
    private java.time.LocalDateTime registrationDate;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "services", columnDefinition = "jsonb")
    private List<String> services;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tags", columnDefinition = "jsonb")
    private List<String> tags;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "notes", columnDefinition = "jsonb")
    private List<Map<String, Object>> notes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "files", columnDefinition = "jsonb")
    private List<Map<String, Object>> files;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payments", columnDefinition = "jsonb")
    private List<Map<String, Object>> payments;
}
