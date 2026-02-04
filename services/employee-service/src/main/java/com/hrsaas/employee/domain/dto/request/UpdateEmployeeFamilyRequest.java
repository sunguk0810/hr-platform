package com.hrsaas.employee.domain.dto.request;

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
public class UpdateEmployeeFamilyRequest {

    @Size(max = 100)
    private String name;

    private LocalDate birthDate;

    @Size(max = 100)
    private String occupation;

    @Size(max = 20)
    private String phone;

    private Boolean isCohabiting;

    private Boolean isDependent;

    @Size(max = 500)
    private String remarks;
}
