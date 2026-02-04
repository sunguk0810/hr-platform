package com.hrsaas.employee.domain.dto.response;

import com.hrsaas.employee.domain.entity.EmployeeCareer;
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
public class EmployeeCareerResponse {

    private UUID id;
    private UUID employeeId;
    private String companyName;
    private String department;
    private String position;
    private LocalDate startDate;
    private LocalDate endDate;
    private String jobDescription;
    private String resignationReason;
    private Boolean isVerified;
    private Instant createdAt;

    public static EmployeeCareerResponse from(EmployeeCareer career) {
        return EmployeeCareerResponse.builder()
            .id(career.getId())
            .employeeId(career.getEmployeeId())
            .companyName(career.getCompanyName())
            .department(career.getDepartment())
            .position(career.getPosition())
            .startDate(career.getStartDate())
            .endDate(career.getEndDate())
            .jobDescription(career.getJobDescription())
            .resignationReason(career.getResignationReason())
            .isVerified(career.getIsVerified())
            .createdAt(career.getCreatedAt())
            .build();
    }
}
