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
public class CreateEmployeeCertificateRequest {

    @NotBlank(message = "자격증명은 필수입니다")
    @Size(max = 200)
    private String certificateName;

    @Size(max = 200)
    private String issuingOrganization;

    @Size(max = 100)
    private String certificateNumber;

    private LocalDate issueDate;

    private LocalDate expiryDate;

    @Size(max = 50)
    private String grade;
}
