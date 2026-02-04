package com.hrsaas.employee.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEmployeeEducationRequest {

    @NotBlank(message = "학교 유형은 필수입니다")
    @Size(max = 30)
    private String schoolType; // HIGH_SCHOOL, COLLEGE, UNIVERSITY, GRADUATE, DOCTORATE

    @NotBlank(message = "학교명은 필수입니다")
    @Size(max = 200)
    private String schoolName;

    @Size(max = 100)
    private String major;

    @Size(max = 50)
    private String degree;

    private LocalDate startDate;

    private LocalDate endDate;

    @Size(max = 20)
    private String graduationStatus; // ENROLLED, GRADUATED, DROPPED_OUT, ON_LEAVE
}
