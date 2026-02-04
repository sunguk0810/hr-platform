package com.hrsaas.recruitment.domain.dto.response;

import com.hrsaas.recruitment.domain.entity.EmploymentType;
import com.hrsaas.recruitment.domain.entity.JobPosting;
import com.hrsaas.recruitment.domain.entity.JobStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 채용공고 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobPostingResponse {

    private UUID id;
    private String jobCode;
    private String title;
    private UUID departmentId;
    private String departmentName;
    private UUID positionId;
    private String positionName;
    private String jobDescription;
    private String requirements;
    private String preferredQualifications;
    private EmploymentType employmentType;
    private Integer experienceMin;
    private Integer experienceMax;
    private BigDecimal salaryMin;
    private BigDecimal salaryMax;
    private boolean salaryNegotiable;
    private String workLocation;
    private Integer headcount;
    private List<String> skills;
    private List<String> benefits;
    private JobStatus status;
    private LocalDate openDate;
    private LocalDate closeDate;
    private UUID recruiterId;
    private String recruiterName;
    private UUID hiringManagerId;
    private String hiringManagerName;
    private Integer applicationCount;
    private Integer viewCount;
    private boolean featured;
    private boolean urgent;
    private List<Map<String, Object>> interviewProcess;
    private boolean open;
    private Instant createdAt;
    private Instant updatedAt;

    public static JobPostingResponse from(JobPosting entity) {
        return JobPostingResponse.builder()
                .id(entity.getId())
                .jobCode(entity.getJobCode())
                .title(entity.getTitle())
                .departmentId(entity.getDepartmentId())
                .departmentName(entity.getDepartmentName())
                .positionId(entity.getPositionId())
                .positionName(entity.getPositionName())
                .jobDescription(entity.getJobDescription())
                .requirements(entity.getRequirements())
                .preferredQualifications(entity.getPreferredQualifications())
                .employmentType(entity.getEmploymentType())
                .experienceMin(entity.getExperienceMin())
                .experienceMax(entity.getExperienceMax())
                .salaryMin(entity.getSalaryMin())
                .salaryMax(entity.getSalaryMax())
                .salaryNegotiable(entity.isSalaryNegotiable())
                .workLocation(entity.getWorkLocation())
                .headcount(entity.getHeadcount())
                .skills(entity.getSkills())
                .benefits(entity.getBenefits())
                .status(entity.getStatus())
                .openDate(entity.getOpenDate())
                .closeDate(entity.getCloseDate())
                .recruiterId(entity.getRecruiterId())
                .recruiterName(entity.getRecruiterName())
                .hiringManagerId(entity.getHiringManagerId())
                .hiringManagerName(entity.getHiringManagerName())
                .applicationCount(entity.getApplicationCount())
                .viewCount(entity.getViewCount())
                .featured(entity.isFeatured())
                .urgent(entity.isUrgent())
                .interviewProcess(entity.getInterviewProcess())
                .open(entity.isOpen())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
