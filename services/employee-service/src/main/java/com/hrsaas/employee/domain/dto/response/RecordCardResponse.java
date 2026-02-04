package com.hrsaas.employee.domain.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.hrsaas.common.privacy.Masked;
import com.hrsaas.common.privacy.MaskType;
import com.hrsaas.common.privacy.serializer.MaskedFieldSerializer;
import com.hrsaas.employee.domain.entity.Employee;
import com.hrsaas.employee.domain.entity.EmployeeStatus;
import com.hrsaas.employee.domain.entity.EmploymentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * 인사기록카드 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecordCardResponse {

    // ===== 기본 정보 =====
    private UUID id;
    private String employeeNumber;

    @Masked(type = MaskType.NAME)
    @JsonSerialize(using = MaskedFieldSerializer.class)
    private String name;

    private String nameEn;

    @Masked(type = MaskType.EMAIL)
    @JsonSerialize(using = MaskedFieldSerializer.class)
    private String email;

    @Masked(type = MaskType.PHONE)
    @JsonSerialize(using = MaskedFieldSerializer.class)
    private String phone;

    @Masked(type = MaskType.PHONE)
    @JsonSerialize(using = MaskedFieldSerializer.class)
    private String mobile;
    private String positionCode;
    private String positionName;
    private String jobTitleCode;
    private String jobTitleName;
    private LocalDate hireDate;
    private LocalDate resignDate;
    private EmployeeStatus status;
    private EmploymentType employmentType;

    // ===== 부서 정보 =====
    private UUID departmentId;
    private String departmentCode;
    private String departmentName;

    // ===== 관리자 정보 =====
    private UUID managerId;

    @Masked(type = MaskType.NAME)
    @JsonSerialize(using = MaskedFieldSerializer.class)
    private String managerName;

    private String managerEmployeeNumber;

    // ===== 근속 정보 =====
    private Integer yearsOfService;
    private Integer monthsOfService;

    // ===== 연관 정보 =====
    private List<EmployeeHistoryResponse> histories;
    private List<EmployeeFamilyResponse> families;
    private List<EmployeeCareerResponse> careers;
    private List<EmployeeEducationResponse> educations;
    private List<EmployeeCertificateResponse> certificates;

    // ===== 메타데이터 =====
    private Instant generatedAt;
    private Instant createdAt;
    private Instant updatedAt;

    public static RecordCardResponse fromEmployee(Employee employee) {
        return RecordCardResponse.builder()
            .id(employee.getId())
            .employeeNumber(employee.getEmployeeNumber())
            .name(employee.getName())
            .nameEn(employee.getNameEn())
            .email(employee.getEmail())
            .phone(employee.getPhone())
            .mobile(employee.getMobile())
            .positionCode(employee.getPositionCode())
            .jobTitleCode(employee.getJobTitleCode())
            .hireDate(employee.getHireDate())
            .resignDate(employee.getResignDate())
            .status(employee.getStatus())
            .employmentType(employee.getEmploymentType())
            .departmentId(employee.getDepartmentId())
            .managerId(employee.getManagerId())
            .createdAt(employee.getCreatedAt())
            .updatedAt(employee.getUpdatedAt())
            .generatedAt(Instant.now())
            .build();
    }

    /**
     * 근속연수 계산
     */
    public void calculateServiceYears() {
        if (hireDate != null) {
            LocalDate endDate = resignDate != null ? resignDate : LocalDate.now();
            long totalMonths = java.time.temporal.ChronoUnit.MONTHS.between(hireDate, endDate);
            this.yearsOfService = (int) (totalMonths / 12);
            this.monthsOfService = (int) (totalMonths % 12);
        }
    }
}
