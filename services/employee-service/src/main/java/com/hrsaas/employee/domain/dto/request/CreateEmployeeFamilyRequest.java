package com.hrsaas.employee.domain.dto.request;

import com.hrsaas.employee.domain.entity.FamilyRelationType;
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
public class CreateEmployeeFamilyRequest {

    @NotNull(message = "관계는 필수입니다")
    private FamilyRelationType relation;

    @NotBlank(message = "이름은 필수입니다")
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
