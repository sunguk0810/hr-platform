package com.hrsaas.attendance.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalTime;

@Entity
@Table(name = "attendance_config", schema = "hr_attendance",
       uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class AttendanceConfig extends TenantAwareEntity {

    @Column(name = "standard_start_time", nullable = false)
    @Builder.Default
    private LocalTime standardStartTime = LocalTime.of(9, 0);

    @Column(name = "standard_end_time", nullable = false)
    @Builder.Default
    private LocalTime standardEndTime = LocalTime.of(18, 0);

    @Column(name = "lunch_break_minutes", nullable = false)
    @Builder.Default
    private Integer lunchBreakMinutes = 60;
}
