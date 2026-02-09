package com.hrsaas.tenant.domain.entity;

import com.hrsaas.common.entity.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "tenant", schema = "tenant_common")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Tenant extends AuditableEntity {

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "name_en", length = 200)
    private String nameEn;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "business_number", length = 20)
    private String businessNumber;

    @Column(name = "representative_name", length = 100)
    private String representativeName;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TenantStatus status = TenantStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "plan_type", nullable = false, length = 20)
    private PlanType planType = PlanType.STANDARD;

    @Column(name = "contract_start_date")
    private LocalDate contractStartDate;

    @Column(name = "contract_end_date")
    private LocalDate contractEndDate;

    @Column(name = "max_employees")
    private Integer maxEmployees;

    @Column(name = "terminated_at")
    private Instant terminatedAt;

    @Column(name = "data_retention_until")
    private Instant dataRetentionUntil;

    // Hierarchy fields
    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "level", nullable = false)
    private Integer level = 0;

    // Admin fields
    @Column(name = "admin_email", length = 100)
    private String adminEmail;

    @Column(name = "admin_name", length = 100)
    private String adminName;

    // JSON data fields
    @Column(name = "branding_data", columnDefinition = "TEXT")
    private String brandingData;

    @Column(name = "settings_data", columnDefinition = "TEXT")
    private String settingsData;

    @Column(name = "hierarchy_data", columnDefinition = "TEXT")
    private String hierarchyData;

    @Column(name = "allowed_modules", columnDefinition = "TEXT")
    private String allowedModules;

    @Column(name = "max_departments")
    private Integer maxDepartments;

    @Builder
    public Tenant(String code, String name, String nameEn, String description,
                  String businessNumber, String representativeName,
                  String address, String phone, String email, String logoUrl,
                  PlanType planType, LocalDate contractStartDate, LocalDate contractEndDate,
                  Integer maxEmployees, UUID parentId, Integer level,
                  String adminEmail, String adminName,
                  String brandingData, String settingsData, String hierarchyData,
                  String allowedModules, Integer maxDepartments) {
        this.code = code;
        this.name = name;
        this.nameEn = nameEn;
        this.description = description;
        this.businessNumber = businessNumber;
        this.representativeName = representativeName;
        this.address = address;
        this.phone = phone;
        this.email = email;
        this.logoUrl = logoUrl;
        this.planType = planType != null ? planType : PlanType.STANDARD;
        this.contractStartDate = contractStartDate;
        this.contractEndDate = contractEndDate;
        this.maxEmployees = maxEmployees;
        this.parentId = parentId;
        this.level = level != null ? level : 0;
        this.adminEmail = adminEmail;
        this.adminName = adminName;
        this.brandingData = brandingData;
        this.settingsData = settingsData;
        this.hierarchyData = hierarchyData;
        this.allowedModules = allowedModules;
        this.maxDepartments = maxDepartments;
        this.status = TenantStatus.ACTIVE;
    }

    public void activate() {
        this.status = TenantStatus.ACTIVE;
    }

    public void suspend() {
        this.status = TenantStatus.SUSPENDED;
    }

    public void terminate() {
        this.status = TenantStatus.TERMINATED;
        this.terminatedAt = Instant.now();
        this.dataRetentionUntil = Instant.now().plusSeconds(90L * 24 * 60 * 60); // 90 days retention
    }

    public void changeStatus(TenantStatus newStatus) {
        if (newStatus == TenantStatus.TERMINATED) {
            terminate();
        } else {
            this.status = newStatus;
        }
    }

    public boolean isActive() {
        return this.status == TenantStatus.ACTIVE;
    }

    public boolean isGroup() {
        return this.level == 0 && this.parentId == null;
    }

    public boolean isSubsidiary() {
        return this.parentId != null;
    }
}
