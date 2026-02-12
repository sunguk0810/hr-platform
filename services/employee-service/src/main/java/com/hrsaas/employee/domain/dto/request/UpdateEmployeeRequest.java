package com.hrsaas.employee.domain.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEmployeeRequest {

    @Size(max = 100, message = "이름은 100자 이하여야 합니다.")
    private String name;

    @Size(max = 100, message = "영문 이름은 100자 이하여야 합니다.")
    private String nameEn;

    @Email(message = "올바른 이메일 형식이 아닙니다.")
    @Size(max = 200, message = "이메일은 200자 이하여야 합니다.")
    private String email;

    @Size(max = 20, message = "전화번호는 20자 이하여야 합니다.")
    private String phone;

    @Size(max = 20, message = "휴대전화번호는 20자 이하여야 합니다.")
    private String mobile;

    private UUID departmentId;

    private String positionCode;

    private String jobTitleCode;

    private UUID managerId;
}
