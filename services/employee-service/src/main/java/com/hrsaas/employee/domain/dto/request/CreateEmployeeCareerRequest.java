package com.hrsaas.employee.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CreateEmployeeCareerRequest {

    @NotBlank(message = "회사명은 필수입니다")
    @Size(max = 200)
    private String companyName;

    @Size(max = 100)
    private String department;

    @Size(max = 100)
    private String position;

    @NotNull(message = "입사일은 필수입니다")
    private LocalDate startDate;

    private LocalDate endDate;

    @Size(max = 1000)
    private String jobDescription;

    @Size(max = 500)
    private String resignationReason;
}
