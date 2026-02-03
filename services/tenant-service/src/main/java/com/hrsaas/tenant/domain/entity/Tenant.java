package com.hrsaas.tenant.domain.entity;

import com.hrsaas.common.entity.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

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

    @Builder
    public Tenant(String code, String name, String businessNumber, String representativeName,
                  String address, String phone, String email, PlanType planType,
                  LocalDate contractStartDate, LocalDate contractEndDate, Integer maxEmployees) {
        this.code = code;
        this.name = name;
        this.businessNumber = businessNumber;
        this.representativeName = representativeName;
        this.address = address;
        this.phone = phone;
        this.email = email;
        this.planType = planType != null ? planType : PlanType.STANDARD;
        this.contractStartDate = contractStartDate;
        this.contractEndDate = contractEndDate;
        this.maxEmployees = maxEmployees;
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
    }

    public boolean isActive() {
        return this.status == TenantStatus.ACTIVE;
    }
}
