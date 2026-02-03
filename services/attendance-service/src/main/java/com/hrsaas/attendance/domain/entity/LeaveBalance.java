package com.hrsaas.attendance.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "leave_balance", schema = "hr_attendance",
       uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "employee_id", "year", "leave_type"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class LeaveBalance extends TenantAwareEntity {

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Enumerated(EnumType.STRING)
    @Column(name = "leave_type", nullable = false)
    private LeaveType leaveType;

    @Column(name = "total_days", nullable = false, precision = 5, scale = 1)
    @Builder.Default
    private BigDecimal totalDays = BigDecimal.ZERO;

    @Column(name = "used_days", nullable = false, precision = 5, scale = 1)
    @Builder.Default
    private BigDecimal usedDays = BigDecimal.ZERO;

    @Column(name = "pending_days", nullable = false, precision = 5, scale = 1)
    @Builder.Default
    private BigDecimal pendingDays = BigDecimal.ZERO;

    @Column(name = "carried_over_days", nullable = false, precision = 5, scale = 1)
    @Builder.Default
    private BigDecimal carriedOverDays = BigDecimal.ZERO;

    public BigDecimal getAvailableDays() {
        return totalDays.add(carriedOverDays).subtract(usedDays).subtract(pendingDays);
    }

    public void addPendingDays(BigDecimal days) {
        this.pendingDays = this.pendingDays.add(days);
    }

    public void confirmUsedDays(BigDecimal days) {
        this.pendingDays = this.pendingDays.subtract(days);
        this.usedDays = this.usedDays.add(days);
    }

    public void releasePendingDays(BigDecimal days) {
        this.pendingDays = this.pendingDays.subtract(days);
    }

    public void releaseUsedDays(BigDecimal days) {
        this.usedDays = this.usedDays.subtract(days);
    }

    public boolean hasEnoughBalance(BigDecimal requestedDays) {
        return getAvailableDays().compareTo(requestedDays) >= 0;
    }
}
