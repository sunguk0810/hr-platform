package com.hrsaas.recruitment.domain.dto.request;

import com.hrsaas.recruitment.domain.entity.EmploymentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/**
 * 채용 제안 생성 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOfferRequest {

    @NotNull(message = "지원서 ID는 필수입니다")
    private UUID applicationId;

    @NotBlank(message = "직책명은 필수입니다")
    @Size(max = 100, message = "직책명은 100자 이내여야 합니다")
    private String positionTitle;

    private UUID departmentId;
    private String departmentName;

    private String gradeCode;
    private String gradeName;

    @NotNull(message = "기본급은 필수입니다")
    private BigDecimal baseSalary;

    private BigDecimal signingBonus;

    private Map<String, Object> benefits;

    @NotNull(message = "입사일은 필수입니다")
    private LocalDate startDate;

    private EmploymentType employmentType = EmploymentType.FULL_TIME;

    private Integer probationMonths = 3;

    @Size(max = 200, message = "근무지는 200자 이내여야 합니다")
    private String workLocation;

    private UUID reportToId;
    private String reportToName;

    private String specialTerms;

    private Instant expiresAt;
}
