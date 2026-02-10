package com.hrsaas.recruitment.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.hrsaas.common.core.exception.BusinessException;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * 채용공고 Entity
 */
@Entity
@Table(name = "job_posting", schema = "hr_recruitment")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class JobPosting extends TenantAwareEntity {

    @Column(name = "job_code", nullable = false, length = 30)
    private String jobCode;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "department_name", length = 100)
    private String departmentName;

    @Column(name = "position_id")
    private UUID positionId;

    @Column(name = "position_name", length = 100)
    private String positionName;

    @Column(name = "job_description", columnDefinition = "TEXT")
    private String jobDescription;

    @Column(name = "requirements", columnDefinition = "TEXT")
    private String requirements;

    @Column(name = "preferred_qualifications", columnDefinition = "TEXT")
    private String preferredQualifications;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type", nullable = false, length = 20)
    private EmploymentType employmentType = EmploymentType.FULL_TIME;

    @Column(name = "experience_min")
    private Integer experienceMin;

    @Column(name = "experience_max")
    private Integer experienceMax;

    @Column(name = "salary_min")
    private BigDecimal salaryMin;

    @Column(name = "salary_max")
    private BigDecimal salaryMax;

    @Column(name = "salary_negotiable")
    private boolean salaryNegotiable = true;

    @Column(name = "work_location", length = 200)
    private String workLocation;

    @Column(name = "headcount")
    private Integer headcount = 1;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "skills", columnDefinition = "jsonb")
    private List<String> skills;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "benefits", columnDefinition = "jsonb")
    private List<String> benefits;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private JobStatus status = JobStatus.DRAFT;

    @Column(name = "open_date")
    private LocalDate openDate;

    @Column(name = "close_date")
    private LocalDate closeDate;

    @Column(name = "recruiter_id")
    private UUID recruiterId;

    @Column(name = "recruiter_name", length = 100)
    private String recruiterName;

    @Column(name = "hiring_manager_id")
    private UUID hiringManagerId;

    @Column(name = "hiring_manager_name", length = 100)
    private String hiringManagerName;

    @Column(name = "application_count")
    private Integer applicationCount = 0;

    @Column(name = "view_count")
    private Integer viewCount = 0;

    @Column(name = "is_featured")
    private boolean featured = false;

    @Column(name = "is_urgent")
    private boolean urgent = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "interview_process", columnDefinition = "jsonb")
    private List<Map<String, Object>> interviewProcess;

    @OneToMany(mappedBy = "jobPosting", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Application> applications = new ArrayList<>();

    @Builder
    public JobPosting(String jobCode, String title, UUID departmentId, String departmentName,
                      UUID positionId, String positionName, String jobDescription,
                      String requirements, String preferredQualifications,
                      EmploymentType employmentType, Integer experienceMin, Integer experienceMax,
                      BigDecimal salaryMin, BigDecimal salaryMax, boolean salaryNegotiable,
                      String workLocation, Integer headcount, List<String> skills, List<String> benefits,
                      LocalDate openDate, LocalDate closeDate,
                      UUID recruiterId, String recruiterName,
                      UUID hiringManagerId, String hiringManagerName,
                      boolean featured, boolean urgent, List<Map<String, Object>> interviewProcess) {
        this.jobCode = jobCode;
        this.title = title;
        this.departmentId = departmentId;
        this.departmentName = departmentName;
        this.positionId = positionId;
        this.positionName = positionName;
        this.jobDescription = jobDescription;
        this.requirements = requirements;
        this.preferredQualifications = preferredQualifications;
        this.employmentType = employmentType != null ? employmentType : EmploymentType.FULL_TIME;
        this.experienceMin = experienceMin;
        this.experienceMax = experienceMax;
        this.salaryMin = salaryMin;
        this.salaryMax = salaryMax;
        this.salaryNegotiable = salaryNegotiable;
        this.workLocation = workLocation;
        this.headcount = headcount != null ? headcount : 1;
        this.skills = skills;
        this.benefits = benefits;
        this.status = JobStatus.DRAFT;
        this.openDate = openDate;
        this.closeDate = closeDate;
        this.recruiterId = recruiterId;
        this.recruiterName = recruiterName;
        this.hiringManagerId = hiringManagerId;
        this.hiringManagerName = hiringManagerName;
        this.applicationCount = 0;
        this.viewCount = 0;
        this.featured = featured;
        this.urgent = urgent;
        this.interviewProcess = interviewProcess;
    }

    private static final Set<JobStatus> PUBLISHABLE = Set.of(JobStatus.DRAFT, JobStatus.PENDING);
    private static final Set<JobStatus> CLOSABLE = Set.of(JobStatus.PUBLISHED);
    private static final Set<JobStatus> COMPLETABLE = Set.of(JobStatus.CLOSED);
    private static final Set<JobStatus> CANCELLABLE = Set.of(JobStatus.DRAFT, JobStatus.PENDING, JobStatus.PUBLISHED, JobStatus.CLOSED);

    public void publish() {
        validateTransition(PUBLISHABLE, "공고");
        this.status = JobStatus.PUBLISHED;
        if (this.openDate == null) {
            this.openDate = LocalDate.now();
        }
    }

    public void close() {
        validateTransition(CLOSABLE, "마감");
        this.status = JobStatus.CLOSED;
    }

    public void complete() {
        validateTransition(COMPLETABLE, "완료");
        this.status = JobStatus.COMPLETED;
    }

    public void cancel() {
        validateTransition(CANCELLABLE, "취소");
        this.status = JobStatus.CANCELLED;
    }

    private void validateTransition(Set<JobStatus> allowed, String action) {
        if (!allowed.contains(this.status)) {
            throw new BusinessException("REC_001",
                    "현재 상태(" + this.status + ")에서 " + action + " 처리할 수 없습니다",
                    HttpStatus.BAD_REQUEST);
        }
    }

    public void incrementViewCount() {
        this.viewCount++;
    }

    public void incrementApplicationCount() {
        this.applicationCount++;
    }

    public boolean isOpen() {
        return this.status == JobStatus.PUBLISHED &&
               (this.closeDate == null || !this.closeDate.isBefore(LocalDate.now()));
    }
}
