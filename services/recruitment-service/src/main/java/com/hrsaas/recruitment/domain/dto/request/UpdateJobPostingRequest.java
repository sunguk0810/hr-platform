package com.hrsaas.recruitment.domain.dto.request;

import com.hrsaas.recruitment.domain.entity.EmploymentType;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 채용공고 수정 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateJobPostingRequest {

    @Size(max = 200, message = "제목은 200자 이내여야 합니다")
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
    private Boolean salaryNegotiable;

    @Size(max = 200, message = "근무지는 200자 이내여야 합니다")
    private String workLocation;

    private Integer headcount;

    private List<String> skills;
    private List<String> benefits;

    private LocalDate openDate;
    private LocalDate closeDate;

    private UUID recruiterId;
    private String recruiterName;
    private UUID hiringManagerId;
    private String hiringManagerName;

    private Boolean featured;
    private Boolean urgent;

    private List<Map<String, Object>> interviewProcess;
}
