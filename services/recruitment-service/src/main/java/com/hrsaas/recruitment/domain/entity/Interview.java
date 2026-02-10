package com.hrsaas.recruitment.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import com.hrsaas.common.core.exception.BusinessException;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * 면접 Entity
 */
@Entity
@Table(name = "interview", schema = "hr_recruitment")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Interview extends TenantAwareEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Enumerated(EnumType.STRING)
    @Column(name = "interview_type", nullable = false, length = 30)
    private InterviewType interviewType;

    @Column(name = "round", nullable = false)
    private Integer round = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private InterviewStatus status = InterviewStatus.SCHEDULING;

    @Column(name = "scheduled_date")
    private LocalDate scheduledDate;

    @Column(name = "scheduled_time")
    private LocalTime scheduledTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes = 60;

    @Column(name = "location", length = 200)
    private String location;

    @Column(name = "meeting_url", length = 500)
    private String meetingUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "interviewers", columnDefinition = "jsonb")
    private List<Map<String, Object>> interviewers;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "result", length = 20)
    private String result;

    @Column(name = "result_notes", columnDefinition = "TEXT")
    private String resultNotes;

    @Column(name = "overall_score")
    private Integer overallScore;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "feedback_deadline")
    private LocalDate feedbackDeadline;

    @OneToMany(mappedBy = "interview", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InterviewScore> scores = new ArrayList<>();

    @Builder
    public Interview(Application application, InterviewType interviewType, Integer round,
                     LocalDate scheduledDate, LocalTime scheduledTime, Integer durationMinutes,
                     String location, String meetingUrl, List<Map<String, Object>> interviewers,
                     String notes, LocalDate feedbackDeadline) {
        this.application = application;
        this.interviewType = interviewType;
        this.round = round != null ? round : 1;
        this.status = InterviewStatus.SCHEDULING;
        this.scheduledDate = scheduledDate;
        this.scheduledTime = scheduledTime;
        this.durationMinutes = durationMinutes != null ? durationMinutes : 60;
        this.location = location;
        this.meetingUrl = meetingUrl;
        this.interviewers = interviewers;
        this.notes = notes;
        this.feedbackDeadline = feedbackDeadline;
    }

    public void schedule(LocalDate date, LocalTime time) {
        validateTransition(Set.of(InterviewStatus.SCHEDULING, InterviewStatus.POSTPONED), "일정 확정");
        this.scheduledDate = date;
        this.scheduledTime = time;
        this.status = InterviewStatus.SCHEDULED;
    }

    public void start() {
        validateTransition(Set.of(InterviewStatus.SCHEDULED), "시작");
        this.status = InterviewStatus.IN_PROGRESS;
        this.startedAt = Instant.now();
    }

    public void complete(String result, Integer overallScore, String resultNotes) {
        validateTransition(Set.of(InterviewStatus.IN_PROGRESS), "완료");
        this.status = InterviewStatus.COMPLETED;
        this.endedAt = Instant.now();
        this.result = result;
        this.overallScore = overallScore;
        this.resultNotes = resultNotes;
    }

    public void cancel() {
        validateTransition(Set.of(InterviewStatus.SCHEDULING, InterviewStatus.SCHEDULED, InterviewStatus.POSTPONED), "취소");
        this.status = InterviewStatus.CANCELLED;
    }

    public void postpone() {
        validateTransition(Set.of(InterviewStatus.SCHEDULED), "연기");
        this.status = InterviewStatus.POSTPONED;
    }

    public void markNoShow() {
        validateTransition(Set.of(InterviewStatus.SCHEDULED), "불참");
        this.status = InterviewStatus.NO_SHOW;
    }

    private void validateTransition(Set<InterviewStatus> allowed, String action) {
        if (!allowed.contains(this.status)) {
            throw new BusinessException("REC_004",
                    "현재 상태(" + this.status + ")에서 " + action + " 처리할 수 없습니다",
                    HttpStatus.BAD_REQUEST);
        }
    }

    public boolean isPassed() {
        return "PASS".equalsIgnoreCase(this.result);
    }
}
