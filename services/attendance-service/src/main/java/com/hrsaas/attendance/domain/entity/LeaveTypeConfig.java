package com.hrsaas.attendance.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "leave_type_config", schema = "hr_attendance",
       uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "code"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class LeaveTypeConfig extends TenantAwareEntity {

    @Column(name = "code", nullable = false, length = 30)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "is_paid", nullable = false)
    @Builder.Default
    private Boolean isPaid = true;

    @Column(name = "max_days_per_year", precision = 5, scale = 1)
    private java.math.BigDecimal maxDaysPerYear;

    @Column(name = "requires_approval", nullable = false)
    @Builder.Default
    private Boolean requiresApproval = true;

    @Column(name = "min_notice_days")
    @Builder.Default
    private Integer minNoticeDays = 0;

    @Column(name = "allow_half_day", nullable = false)
    @Builder.Default
    private Boolean allowHalfDay = true;

    @Column(name = "allow_hourly", nullable = false)
    @Builder.Default
    private Boolean allowHourly = false;

    @Column(name = "deduct_from_annual", nullable = false)
    @Builder.Default
    private Boolean deductFromAnnual = false;

    @Column(name = "min_service_months")
    private Integer minServiceMonths;

    @Column(name = "gender_restriction", length = 10)
    private String genderRestriction; // M, F, null=both

    @Column(name = "max_consecutive_days")
    private Integer maxConsecutiveDays;

    @Column(name = "blackout_periods", columnDefinition = "JSONB")
    private String blackoutPeriods; // JSON array of {startMonth, startDay, endMonth, endDay}

    @Column(name = "approval_template_code", length = 50)
    private String approvalTemplateCode;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
