package com.hrsaas.appointment.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * 예약 발령 Entity
 */
@Entity
@Table(name = "appointment_schedule", schema = "hr_appointment")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AppointmentSchedule extends TenantAwareEntity {

    @Column(name = "draft_id", nullable = false)
    private UUID draftId;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "scheduled_time")
    private LocalTime scheduledTime = LocalTime.of(0, 0);

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ScheduleStatus status = ScheduleStatus.SCHEDULED;

    @Column(name = "executed_at")
    private Instant executedAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "retry_count")
    private Integer retryCount = 0;

    @Builder
    public AppointmentSchedule(UUID draftId, LocalDate scheduledDate, LocalTime scheduledTime) {
        this.draftId = draftId;
        this.scheduledDate = scheduledDate;
        this.scheduledTime = scheduledTime != null ? scheduledTime : LocalTime.of(0, 0);
        this.status = ScheduleStatus.SCHEDULED;
        this.retryCount = 0;
    }

    public void startProcessing() {
        this.status = ScheduleStatus.PROCESSING;
    }

    public void complete() {
        this.status = ScheduleStatus.COMPLETED;
        this.executedAt = Instant.now();
    }

    public void fail(String errorMessage) {
        this.status = ScheduleStatus.FAILED;
        this.errorMessage = errorMessage;
        this.retryCount++;
    }

    public void cancel() {
        this.status = ScheduleStatus.CANCELLED;
    }

    public boolean canRetry() {
        return retryCount < 3 && status == ScheduleStatus.FAILED;
    }
}
