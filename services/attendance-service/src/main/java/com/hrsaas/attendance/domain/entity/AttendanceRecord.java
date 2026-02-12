package com.hrsaas.attendance.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "attendance_record", schema = "hr_attendance",
       uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "employee_id", "work_date"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class AttendanceRecord extends TenantAwareEntity {

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "check_in_time")
    private LocalTime checkInTime;

    @Column(name = "check_out_time")
    private LocalTime checkOutTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private AttendanceStatus status = AttendanceStatus.NORMAL;

    @Column(name = "late_minutes")
    @Builder.Default
    private Integer lateMinutes = 0;

    @Column(name = "early_leave_minutes")
    @Builder.Default
    private Integer earlyLeaveMinutes = 0;

    @Column(name = "overtime_minutes")
    @Builder.Default
    private Integer overtimeMinutes = 0;

    @Column(name = "work_hours")
    @Builder.Default
    private Integer workHours = 0;

    @Column(name = "check_in_location")
    private String checkInLocation;

    @Column(name = "check_out_location")
    private String checkOutLocation;

    @Column(name = "note")
    private String note;

    public void checkIn(LocalTime time, String location, LocalTime standardStartTime) {
        this.checkInTime = time;
        this.checkInLocation = location;
        calculateLateMinutes(standardStartTime);
    }

    public void checkOut(LocalTime time, String location, LocalTime standardEndTime, int lunchBreakMinutes) {
        this.checkOutTime = time;
        this.checkOutLocation = location;
        calculateWorkHours(lunchBreakMinutes);
        calculateEarlyLeaveMinutes(standardEndTime);
        calculateOvertimeMinutes(standardEndTime);
    }

    private void calculateLateMinutes(LocalTime standardStartTime) {
        if (checkInTime != null && checkInTime.isAfter(standardStartTime)) {
            this.lateMinutes = (int) java.time.Duration.between(standardStartTime, checkInTime).toMinutes();
            this.status = AttendanceStatus.LATE;
        }
    }

    private void calculateEarlyLeaveMinutes(LocalTime standardEndTime) {
        if (checkOutTime != null && checkOutTime.isBefore(standardEndTime)) {
            this.earlyLeaveMinutes = (int) java.time.Duration.between(checkOutTime, standardEndTime).toMinutes();
            if (this.status == AttendanceStatus.NORMAL) {
                this.status = AttendanceStatus.EARLY_LEAVE;
            }
        }
    }

    public void calculateWorkHours(int lunchBreakMinutes) {
        if (checkInTime != null && checkOutTime != null) {
            long minutes = java.time.Duration.between(checkInTime, checkOutTime).toMinutes();

            // TODO: Implement conditional deduction logic (Future Feature)
            // 1. Add minWorkHoursForDeduction parameter (e.g., deduct only if worked > 4 hours)
            // 2. Handle circular dependency: deduction depends on work hours, but work hours depend on deduction.
            //    -> Use total stay duration (checkOut - checkIn) as the base for conditions.
            // 3. Consider legal requirements for break time placement (e.g., middle of work).
            minutes -= lunchBreakMinutes;

            this.workHours = (int) Math.round(minutes / 60.0);
        }
    }

    private void calculateOvertimeMinutes(LocalTime standardEndTime) {
        if (checkOutTime != null && checkOutTime.isAfter(standardEndTime)) {
            this.overtimeMinutes = (int) java.time.Duration.between(standardEndTime, checkOutTime).toMinutes();
        }
    }
}
