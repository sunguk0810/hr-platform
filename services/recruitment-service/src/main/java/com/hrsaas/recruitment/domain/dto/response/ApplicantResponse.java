package com.hrsaas.recruitment.domain.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.hrsaas.common.privacy.Masked;
import com.hrsaas.common.privacy.MaskType;
import com.hrsaas.common.privacy.serializer.MaskedFieldSerializer;
import com.hrsaas.recruitment.domain.entity.Applicant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 지원자 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicantResponse {

    private UUID id;

    @Masked(type = MaskType.NAME)
    @JsonSerialize(using = MaskedFieldSerializer.class)
    private String name;

    @Masked(type = MaskType.EMAIL)
    @JsonSerialize(using = MaskedFieldSerializer.class)
    private String email;

    @Masked(type = MaskType.PHONE)
    @JsonSerialize(using = MaskedFieldSerializer.class)
    private String phone;

    private LocalDate birthDate;
    private String gender;

    @Masked(type = MaskType.ADDRESS)
    @JsonSerialize(using = MaskedFieldSerializer.class)
    private String address;
    private UUID resumeFileId;
    private String portfolioUrl;
    private String linkedinUrl;
    private String githubUrl;
    private List<Map<String, Object>> education;
    private List<Map<String, Object>> experience;
    private List<String> skills;
    private List<Map<String, Object>> certificates;
    private List<Map<String, Object>> languages;
    private String source;
    private String sourceDetail;
    private String notes;
    private boolean blacklisted;
    private String blacklistReason;
    private int applicationCount;
    private Instant createdAt;
    private Instant updatedAt;

    public static ApplicantResponse from(Applicant entity) {
        return ApplicantResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .email(entity.getEmail())
                .phone(entity.getPhone())
                .birthDate(entity.getBirthDate())
                .gender(entity.getGender())
                .address(entity.getAddress())
                .resumeFileId(entity.getResumeFileId())
                .portfolioUrl(entity.getPortfolioUrl())
                .linkedinUrl(entity.getLinkedinUrl())
                .githubUrl(entity.getGithubUrl())
                .education(entity.getEducation())
                .experience(entity.getExperience())
                .skills(entity.getSkills())
                .certificates(entity.getCertificates())
                .languages(entity.getLanguages())
                .source(entity.getSource())
                .sourceDetail(entity.getSourceDetail())
                .notes(entity.getNotes())
                .blacklisted(entity.isBlacklisted())
                .blacklistReason(entity.getBlacklistReason())
                .applicationCount(entity.getApplications() != null ? entity.getApplications().size() : 0)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
