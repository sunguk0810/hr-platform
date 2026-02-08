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
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeResponse {

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

    private UUID departmentId;
    private String departmentName;
    private String positionCode;
    private String positionName;
    private String jobTitleCode;
    private String gradeCode;
    private String gradeName;
    private LocalDate hireDate;
    private LocalDate resignDate;
    private EmployeeStatus status;
    private EmploymentType employmentType;
    private UUID managerId;
    private String managerName;
    private Instant createdAt;
    private Instant updatedAt;

    public static EmployeeResponse from(Employee employee) {
        return EmployeeResponse.builder()
            .id(employee.getId())
            .employeeNumber(employee.getEmployeeNumber())
            .name(employee.getName())
            .nameEn(employee.getNameEn())
            .email(employee.getEmail())
            .phone(employee.getPhone())
            .mobile(employee.getMobile())
            .departmentId(employee.getDepartmentId())
            .positionCode(employee.getPositionCode())
            .jobTitleCode(employee.getJobTitleCode())
            .hireDate(employee.getHireDate())
            .resignDate(employee.getResignDate())
            .status(employee.getStatus())
            .employmentType(employee.getEmploymentType())
            .managerId(employee.getManagerId())
            .createdAt(employee.getCreatedAt())
            .updatedAt(employee.getUpdatedAt())
            .build();
    }
}
