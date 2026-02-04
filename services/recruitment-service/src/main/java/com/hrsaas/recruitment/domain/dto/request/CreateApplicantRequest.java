package com.hrsaas.recruitment.domain.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 지원자 생성 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateApplicantRequest {

    @NotBlank(message = "이름은 필수입니다")
    @Size(max = 100, message = "이름은 100자 이내여야 합니다")
    private String name;

    @NotBlank(message = "이메일은 필수입니다")
    @Email(message = "유효한 이메일 형식이어야 합니다")
    @Size(max = 200, message = "이메일은 200자 이내여야 합니다")
    private String email;

    @Size(max = 20, message = "전화번호는 20자 이내여야 합니다")
    private String phone;

    private LocalDate birthDate;
    private String gender;

    @Size(max = 500, message = "주소는 500자 이내여야 합니다")
    private String address;

    private UUID resumeFileId;

    @Size(max = 500, message = "포트폴리오 URL은 500자 이내여야 합니다")
    private String portfolioUrl;

    @Size(max = 500, message = "LinkedIn URL은 500자 이내여야 합니다")
    private String linkedinUrl;

    @Size(max = 500, message = "GitHub URL은 500자 이내여야 합니다")
    private String githubUrl;

    private List<Map<String, Object>> education;
    private List<Map<String, Object>> experience;
    private List<String> skills;
    private List<Map<String, Object>> certificates;
    private List<Map<String, Object>> languages;

    @Size(max = 50, message = "소스는 50자 이내여야 합니다")
    private String source;

    @Size(max = 200, message = "소스 상세는 200자 이내여야 합니다")
    private String sourceDetail;

    private String notes;
}
