package com.hrsaas.recruitment.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import com.hrsaas.common.core.exception.BusinessException;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * 채용 제안 Entity
 */
@Entity
@Table(name = "offer", schema = "hr_recruitment")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Offer extends TenantAwareEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Column(name = "offer_number", nullable = false, length = 50)
    private String offerNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OfferStatus status = OfferStatus.DRAFT;

    @Column(name = "position_title", nullable = false, length = 100)
    private String positionTitle;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "department_name", length = 100)
    private String departmentName;

    @Column(name = "grade_code", length = 30)
    private String gradeCode;

    @Column(name = "grade_name", length = 50)
    private String gradeName;

    @Column(name = "base_salary", nullable = false)
    private BigDecimal baseSalary;

    @Column(name = "signing_bonus")
    private BigDecimal signingBonus;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "benefits", columnDefinition = "jsonb")
    private Map<String, Object> benefits;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type", nullable = false, length = 20)
    private EmploymentType employmentType = EmploymentType.FULL_TIME;

    @Column(name = "probation_months")
    private Integer probationMonths = 3;

    @Column(name = "work_location", length = 200)
    private String workLocation;

    @Column(name = "report_to_id")
    private UUID reportToId;

    @Column(name = "report_to_name", length = 100)
    private String reportToName;

    @Column(name = "offer_letter_file_id")
    private UUID offerLetterFileId;

    @Column(name = "special_terms", columnDefinition = "TEXT")
    private String specialTerms;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "responded_at")
    private Instant respondedAt;

    @Column(name = "decline_reason", columnDefinition = "TEXT")
    private String declineReason;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "negotiation_notes", columnDefinition = "TEXT")
    private String negotiationNotes;

    @Builder
    public Offer(Application application, String offerNumber, String positionTitle,
                 UUID departmentId, String departmentName, String gradeCode, String gradeName,
                 BigDecimal baseSalary, BigDecimal signingBonus, Map<String, Object> benefits,
                 LocalDate startDate, EmploymentType employmentType, Integer probationMonths,
                 String workLocation, UUID reportToId, String reportToName,
                 String specialTerms, Instant expiresAt) {
        this.application = application;
        this.offerNumber = offerNumber;
        this.status = OfferStatus.DRAFT;
        this.positionTitle = positionTitle;
        this.departmentId = departmentId;
        this.departmentName = departmentName;
        this.gradeCode = gradeCode;
        this.gradeName = gradeName;
        this.baseSalary = baseSalary;
        this.signingBonus = signingBonus;
        this.benefits = benefits;
        this.startDate = startDate;
        this.employmentType = employmentType != null ? employmentType : EmploymentType.FULL_TIME;
        this.probationMonths = probationMonths != null ? probationMonths : 3;
        this.workLocation = workLocation;
        this.reportToId = reportToId;
        this.reportToName = reportToName;
        this.specialTerms = specialTerms;
        this.expiresAt = expiresAt;
    }

    private static final Set<OfferStatus> TERMINAL_STATES = Set.of(
            OfferStatus.ACCEPTED, OfferStatus.DECLINED, OfferStatus.EXPIRED, OfferStatus.CANCELLED);

    public void submitForApproval() {
        validateTransition(Set.of(OfferStatus.DRAFT), "승인 요청");
        this.status = OfferStatus.PENDING_APPROVAL;
    }

    public void approve(UUID approvedBy) {
        validateTransition(Set.of(OfferStatus.PENDING_APPROVAL), "승인");
        this.status = OfferStatus.APPROVED;
        this.approvedBy = approvedBy;
        this.approvedAt = Instant.now();
    }

    public void send() {
        validateTransition(Set.of(OfferStatus.APPROVED), "발송");
        this.status = OfferStatus.SENT;
        this.sentAt = Instant.now();
    }

    public void accept() {
        validateTransition(Set.of(OfferStatus.SENT, OfferStatus.NEGOTIATING), "수락");
        this.status = OfferStatus.ACCEPTED;
        this.respondedAt = Instant.now();
    }

    public void decline(String reason) {
        validateTransition(Set.of(OfferStatus.SENT, OfferStatus.NEGOTIATING), "거절");
        this.status = OfferStatus.DECLINED;
        this.declineReason = reason;
        this.respondedAt = Instant.now();
    }

    public void negotiate(String notes) {
        validateTransition(Set.of(OfferStatus.SENT, OfferStatus.NEGOTIATING), "협상");
        this.status = OfferStatus.NEGOTIATING;
        this.negotiationNotes = notes;
    }

    public void expire() {
        this.status = OfferStatus.EXPIRED;
    }

    public void cancel() {
        if (TERMINAL_STATES.contains(this.status)) {
            throw new BusinessException("REC_003",
                    "현재 상태(" + this.status + ")에서 취소할 수 없습니다",
                    HttpStatus.BAD_REQUEST);
        }
        this.status = OfferStatus.CANCELLED;
    }

    private void validateTransition(Set<OfferStatus> allowed, String action) {
        if (!allowed.contains(this.status)) {
            throw new BusinessException("REC_003",
                    "현재 상태(" + this.status + ")에서 " + action + " 처리할 수 없습니다",
                    HttpStatus.BAD_REQUEST);
        }
    }

    public boolean isExpired() {
        return this.expiresAt != null && Instant.now().isAfter(this.expiresAt);
    }
}
