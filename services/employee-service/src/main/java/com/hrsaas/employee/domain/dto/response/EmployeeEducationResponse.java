package com.hrsaas.employee.domain.dto.response;

import com.hrsaas.employee.domain.entity.EmployeeEducation;
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
public class EmployeeEducationResponse {

    private UUID id;
    private UUID employeeId;
    private String schoolType;
    private String schoolName;
    private String major;
    private String degree;
    private LocalDate startDate;
    private LocalDate endDate;
    private String graduationStatus;
    private Boolean isVerified;
    private Instant createdAt;

    public static EmployeeEducationResponse from(EmployeeEducation education) {
        return EmployeeEducationResponse.builder()
            .id(education.getId())
            .employeeId(education.getEmployeeId())
            .schoolType(education.getSchoolType())
            .schoolName(education.getSchoolName())
            .major(education.getMajor())
            .degree(education.getDegree())
            .startDate(education.getStartDate())
            .endDate(education.getEndDate())
            .graduationStatus(education.getGraduationStatus())
            .isVerified(education.getIsVerified())
            .createdAt(education.getCreatedAt())
            .build();
    }
}
