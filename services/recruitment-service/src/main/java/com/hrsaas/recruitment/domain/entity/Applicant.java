package com.hrsaas.recruitment.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 지원자 Entity
 */
@Entity
@Table(name = "applicant", schema = "hr_recruitment")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Applicant extends TenantAwareEntity {

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "email", nullable = false, length = 200)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "gender", length = 10)
    private String gender;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "resume_file_id")
    private UUID resumeFileId;

    @Column(name = "portfolio_url", length = 500)
    private String portfolioUrl;

    @Column(name = "linkedin_url", length = 500)
    private String linkedinUrl;

    @Column(name = "github_url", length = 500)
    private String githubUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "education", columnDefinition = "jsonb")
    private List<Map<String, Object>> education;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "experience", columnDefinition = "jsonb")
    private List<Map<String, Object>> experience;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "skills", columnDefinition = "jsonb")
    private List<String> skills;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "certificates", columnDefinition = "jsonb")
    private List<Map<String, Object>> certificates;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "languages", columnDefinition = "jsonb")
    private List<Map<String, Object>> languages;

    @Column(name = "source", length = 50)
    private String source;

    @Column(name = "source_detail", length = 200)
    private String sourceDetail;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "is_blacklisted")
    private boolean blacklisted = false;

    @Column(name = "blacklist_reason", columnDefinition = "TEXT")
    private String blacklistReason;

    @OneToMany(mappedBy = "applicant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Application> applications = new ArrayList<>();

    @Builder
    public Applicant(String name, String email, String phone, LocalDate birthDate, String gender,
                     String address, UUID resumeFileId, String portfolioUrl, String linkedinUrl,
                     String githubUrl, List<Map<String, Object>> education,
                     List<Map<String, Object>> experience, List<String> skills,
                     List<Map<String, Object>> certificates, List<Map<String, Object>> languages,
                     String source, String sourceDetail, String notes) {
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.birthDate = birthDate;
        this.gender = gender;
        this.address = address;
        this.resumeFileId = resumeFileId;
        this.portfolioUrl = portfolioUrl;
        this.linkedinUrl = linkedinUrl;
        this.githubUrl = githubUrl;
        this.education = education;
        this.experience = experience;
        this.skills = skills;
        this.certificates = certificates;
        this.languages = languages;
        this.source = source;
        this.sourceDetail = sourceDetail;
        this.notes = notes;
        this.blacklisted = false;
    }

    public void blacklist(String reason) {
        this.blacklisted = true;
        this.blacklistReason = reason;
    }

    public void unblacklist() {
        this.blacklisted = false;
        this.blacklistReason = null;
    }
}
