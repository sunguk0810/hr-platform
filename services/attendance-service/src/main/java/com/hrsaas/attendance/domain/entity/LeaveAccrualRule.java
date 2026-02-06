package com.hrsaas.attendance.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "leave_accrual_rule", schema = "hr_attendance",
       uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "leave_type_code"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class LeaveAccrualRule extends TenantAwareEntity {

    @Column(name = "leave_type_code", nullable = false, length = 30)
    private String leaveTypeCode;

    @Column(name = "accrual_type", nullable = false, length = 20)
    private String accrualType; // YEARLY, MONTHLY, HIRE_DATE_BASED

    @Column(name = "base_entitlement", nullable = false, precision = 5, scale = 1)
    @Builder.Default
    private BigDecimal baseEntitlement = new BigDecimal("15");

    @Column(name = "service_year_bonuses", columnDefinition = "JSONB")
    private String serviceYearBonuses; // [{"minYears":1,"maxYears":3,"bonusDays":1}, ...]

    @Column(name = "max_carry_over_days", precision = 5, scale = 1)
    @Builder.Default
    private BigDecimal maxCarryOverDays = BigDecimal.ZERO;

    @Column(name = "carry_over_expiry_months")
    @Builder.Default
    private Integer carryOverExpiryMonths = 3;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
