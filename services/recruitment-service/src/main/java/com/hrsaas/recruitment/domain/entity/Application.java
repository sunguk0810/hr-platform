package com.hrsaas.recruitment.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import com.hrsaas.common.core.exception.BusinessException;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * 지원서 Entity
 */
@Entity
@Table(name = "application", schema = "hr_recruitment")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Application extends TenantAwareEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_posting_id", nullable = false)
    private JobPosting jobPosting;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "applicant_id", nullable = false)
    private Applicant applicant;

    @Column(name = "application_number", nullable = false, length = 50)
    private String applicationNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ApplicationStatus status = ApplicationStatus.SUBMITTED;

    @Column(name = "cover_letter", columnDefinition = "TEXT")
    private String coverLetter;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "answers", columnDefinition = "jsonb")
    private List<Map<String, Object>> answers;

    @Column(name = "expected_salary")
    private Long expectedSalary;

    @Column(name = "available_date")
    private String availableDate;

    @Column(name = "referrer_name", length = 100)
    private String referrerName;

    @Column(name = "referrer_employee_id")
    private UUID referrerEmployeeId;

    @Column(name = "screening_score")
    private Integer screeningScore;

    @Column(name = "screening_notes", columnDefinition = "TEXT")
    private String screeningNotes;

    @Column(name = "screened_by")
    private UUID screenedBy;

    @Column(name = "screened_at")
    private Instant screenedAt;

    @Column(name = "current_stage", length = 50)
    private String currentStage = "DOCUMENT";

    @Column(name = "stage_order")
    private Integer stageOrder = 0;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "rejected_at")
    private Instant rejectedAt;

    @Column(name = "withdrawn_at")
    private Instant withdrawnAt;

    @Column(name = "hired_at")
    private Instant hiredAt;

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Interview> interviews = new ArrayList<>();

    @OneToOne(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    private Offer offer;

    @Builder
    public Application(JobPosting jobPosting, Applicant applicant, String applicationNumber,
                       String coverLetter, List<Map<String, Object>> answers,
                       Long expectedSalary, String availableDate,
                       String referrerName, UUID referrerEmployeeId) {
        this.jobPosting = jobPosting;
        this.applicant = applicant;
        this.applicationNumber = applicationNumber;
        this.coverLetter = coverLetter;
        this.answers = answers;
        this.expectedSalary = expectedSalary;
        this.availableDate = availableDate;
        this.referrerName = referrerName;
        this.referrerEmployeeId = referrerEmployeeId;
        this.status = ApplicationStatus.SUBMITTED;
        this.currentStage = "DOCUMENT";
        this.stageOrder = 0;
    }

    private static final Set<ApplicationStatus> TERMINAL_STATES = Set.of(
            ApplicationStatus.HIRED, ApplicationStatus.WITHDRAWN, ApplicationStatus.REJECTED,
            ApplicationStatus.SCREENING_REJECTED, ApplicationStatus.INTERVIEW_REJECTED);

    public void screen(UUID screenedBy, Integer score, String notes, boolean passed) {
        validateTransition(Set.of(ApplicationStatus.SUBMITTED), "서류심사");
        this.screenedBy = screenedBy;
        this.screenedAt = Instant.now();
        this.screeningScore = score;
        this.screeningNotes = notes;
        this.status = passed ? ApplicationStatus.SCREENED : ApplicationStatus.SCREENING_REJECTED;
        if (passed) {
            this.currentStage = "INTERVIEW";
            this.stageOrder = 1;
        }
    }

    public void startInterview() {
        validateTransition(Set.of(ApplicationStatus.SCREENED), "면접 시작");
        this.status = ApplicationStatus.INTERVIEWING;
    }

    public void passInterview() {
        validateTransition(Set.of(ApplicationStatus.INTERVIEWING), "면접 통과");
        this.status = ApplicationStatus.INTERVIEW_PASSED;
    }

    public void failInterview() {
        validateTransition(Set.of(ApplicationStatus.INTERVIEWING), "면접 탈락");
        this.status = ApplicationStatus.INTERVIEW_REJECTED;
    }

    public void makeOffer() {
        validateTransition(Set.of(ApplicationStatus.INTERVIEW_PASSED), "제안");
        this.status = ApplicationStatus.OFFER_PENDING;
        this.currentStage = "OFFER";
    }

    public void hire() {
        validateTransition(Set.of(ApplicationStatus.OFFER_PENDING), "채용 확정");
        this.status = ApplicationStatus.HIRED;
        this.hiredAt = Instant.now();
    }

    public void reject(String reason) {
        if (TERMINAL_STATES.contains(this.status)) {
            throw new BusinessException("REC_002",
                    "현재 상태(" + this.status + ")에서 불합격 처리할 수 없습니다",
                    HttpStatus.BAD_REQUEST);
        }
        this.status = ApplicationStatus.REJECTED;
        this.rejectionReason = reason;
        this.rejectedAt = Instant.now();
    }

    public void withdraw() {
        if (this.status == ApplicationStatus.HIRED) {
            throw new BusinessException("REC_002",
                    "채용 확정 후에는 지원 취소할 수 없습니다",
                    HttpStatus.BAD_REQUEST);
        }
        this.status = ApplicationStatus.WITHDRAWN;
        this.withdrawnAt = Instant.now();
    }

    private void validateTransition(Set<ApplicationStatus> allowed, String action) {
        if (!allowed.contains(this.status)) {
            throw new BusinessException("REC_002",
                    "현재 상태(" + this.status + ")에서 " + action + " 처리할 수 없습니다",
                    HttpStatus.BAD_REQUEST);
        }
    }

    public void moveToNextStage(String stageName, int order) {
        this.currentStage = stageName;
        this.stageOrder = order;
    }
}
