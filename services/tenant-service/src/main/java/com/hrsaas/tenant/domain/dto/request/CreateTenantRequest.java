package com.hrsaas.tenant.domain.dto.request;

import com.hrsaas.tenant.domain.entity.PlanType;
import jakarta.validation.constraints.Email;
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
public class CreateTenantRequest {

    @NotBlank(message = "테넌트 코드를 입력해주세요.")
    @Size(max = 50, message = "테넌트 코드는 50자 이하여야 합니다.")
    private String code;

    @NotBlank(message = "테넌트명을 입력해주세요.")
    @Size(max = 200, message = "테넌트명은 200자 이하여야 합니다.")
    private String name;

    @Size(max = 20, message = "사업자번호는 20자 이하여야 합니다.")
    private String businessNumber;

    @Size(max = 100, message = "대표자명은 100자 이하여야 합니다.")
    private String representativeName;

    @Size(max = 500, message = "주소는 500자 이하여야 합니다.")
    private String address;

    @Size(max = 20, message = "전화번호는 20자 이하여야 합니다.")
    private String phone;

    @Email(message = "올바른 이메일 형식이 아닙니다.")
    @Size(max = 100, message = "이메일은 100자 이하여야 합니다.")
    private String email;

    private PlanType planType;

    private LocalDate contractStartDate;

    private LocalDate contractEndDate;

    private Integer maxEmployees;
}
