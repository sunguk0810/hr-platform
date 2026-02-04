package com.hrsaas.employee.domain.dto.request;

import com.hrsaas.employee.domain.entity.EmploymentType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 직원 일괄등록 요청 DTO (단일 직원 항목)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkEmployeeRequest {

    @NotBlank(message = "사번을 입력해주세요.")
    @Size(max = 50, message = "사번은 50자 이하여야 합니다.")
    private String employeeNumber;

    @NotBlank(message = "이름을 입력해주세요.")
    @Size(max = 100, message = "이름은 100자 이하여야 합니다.")
    private String name;

    @Size(max = 100, message = "영문 이름은 100자 이하여야 합니다.")
    private String nameEn;

    @NotBlank(message = "이메일을 입력해주세요.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    @Size(max = 200, message = "이메일은 200자 이하여야 합니다.")
    private String email;

    @Size(max = 20, message = "전화번호는 20자 이하여야 합니다.")
    private String phone;

    @Size(max = 20, message = "휴대전화번호는 20자 이하여야 합니다.")
    private String mobile;

    /**
     * 부서 코드 (부서 ID 대신 코드로 지정)
     */
    private String departmentCode;

    /**
     * 직책 코드
     */
    private String positionCode;

    /**
     * 직위/직급 코드
     */
    private String jobTitleCode;

    /**
     * 입사일
     */
    private LocalDate hireDate;

    /**
     * 고용유형
     */
    private EmploymentType employmentType;

    /**
     * 관리자 사번 (관리자 ID 대신 사번으로 지정)
     */
    private String managerEmployeeNumber;
}
