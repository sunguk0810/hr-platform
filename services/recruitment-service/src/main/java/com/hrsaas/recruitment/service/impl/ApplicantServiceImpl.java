package com.hrsaas.recruitment.service.impl;

import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.ErrorCode;
import com.hrsaas.recruitment.domain.dto.request.CreateApplicantRequest;
import com.hrsaas.recruitment.domain.dto.response.ApplicantResponse;
import com.hrsaas.recruitment.domain.entity.Applicant;
import com.hrsaas.recruitment.repository.ApplicantRepository;
import com.hrsaas.recruitment.service.ApplicantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApplicantServiceImpl implements ApplicantService {

    private final ApplicantRepository applicantRepository;

    @Override
    @Transactional
    public ApplicantResponse create(CreateApplicantRequest request) {
        log.info("Creating applicant: {}", request.getEmail());

        if (applicantRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "이미 등록된 이메일입니다: " + request.getEmail());
        }

        Applicant applicant = Applicant.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .birthDate(request.getBirthDate())
                .gender(request.getGender())
                .address(request.getAddress())
                .resumeFileId(request.getResumeFileId())
                .portfolioUrl(request.getPortfolioUrl())
                .linkedinUrl(request.getLinkedinUrl())
                .githubUrl(request.getGithubUrl())
                .education(request.getEducation())
                .experience(request.getExperience())
                .skills(request.getSkills())
                .certificates(request.getCertificates())
                .languages(request.getLanguages())
                .source(request.getSource())
                .sourceDetail(request.getSourceDetail())
                .notes(request.getNotes())
                .build();

        Applicant saved = applicantRepository.save(applicant);
        log.info("Applicant created: {}", saved.getId());

        return ApplicantResponse.from(saved);
    }

    @Override
    public ApplicantResponse getById(UUID id) {
        Applicant applicant = applicantRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "지원자를 찾을 수 없습니다: " + id));
        return ApplicantResponse.from(applicant);
    }

    @Override
    public ApplicantResponse getByEmail(String email) {
        Applicant applicant = applicantRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "지원자를 찾을 수 없습니다: " + email));
        return ApplicantResponse.from(applicant);
    }

    @Override
    public Page<ApplicantResponse> getAll(Pageable pageable) {
        return applicantRepository.findAll(pageable).map(ApplicantResponse::from);
    }

    @Override
    public Page<ApplicantResponse> search(String keyword, Pageable pageable) {
        return applicantRepository.searchByKeyword(keyword, pageable).map(ApplicantResponse::from);
    }

    @Override
    public Page<ApplicantResponse> getBlacklisted(Pageable pageable) {
        return applicantRepository.findByBlacklistedTrueOrderByCreatedAtDesc(pageable)
                .map(ApplicantResponse::from);
    }

    @Override
    @Transactional
    public ApplicantResponse update(UUID id, CreateApplicantRequest request) {
        log.info("Updating applicant: {}", id);

        Applicant applicant = applicantRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "지원자를 찾을 수 없습니다: " + id));

        applicant.setName(request.getName());
        applicant.setPhone(request.getPhone());
        applicant.setBirthDate(request.getBirthDate());
        applicant.setGender(request.getGender());
        applicant.setAddress(request.getAddress());
        applicant.setResumeFileId(request.getResumeFileId());
        applicant.setPortfolioUrl(request.getPortfolioUrl());
        applicant.setLinkedinUrl(request.getLinkedinUrl());
        applicant.setGithubUrl(request.getGithubUrl());
        applicant.setEducation(request.getEducation());
        applicant.setExperience(request.getExperience());
        applicant.setSkills(request.getSkills());
        applicant.setCertificates(request.getCertificates());
        applicant.setLanguages(request.getLanguages());
        applicant.setNotes(request.getNotes());

        return ApplicantResponse.from(applicantRepository.save(applicant));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        log.info("Deleting applicant: {}", id);
        if (!applicantRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "지원자를 찾을 수 없습니다: " + id);
        }
        applicantRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void blacklist(UUID id, String reason) {
        log.info("Blacklisting applicant: {}", id);

        Applicant applicant = applicantRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "지원자를 찾을 수 없습니다: " + id));

        applicant.blacklist(reason);
        applicantRepository.save(applicant);
    }

    @Override
    @Transactional
    public void unblacklist(UUID id) {
        log.info("Unblacklisting applicant: {}", id);

        Applicant applicant = applicantRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "지원자를 찾을 수 없습니다: " + id));

        applicant.unblacklist();
        applicantRepository.save(applicant);
    }
}
