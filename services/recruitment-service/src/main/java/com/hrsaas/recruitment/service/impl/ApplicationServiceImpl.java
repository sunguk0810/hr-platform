package com.hrsaas.recruitment.service.impl;

import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.ErrorCode;
import com.hrsaas.recruitment.domain.dto.request.CreateApplicationRequest;
import com.hrsaas.recruitment.domain.dto.request.ScreenApplicationRequest;
import com.hrsaas.recruitment.domain.dto.response.ApplicationResponse;
import com.hrsaas.recruitment.domain.dto.response.ApplicationStageCountResponse;
import com.hrsaas.recruitment.domain.dto.response.ApplicationSummaryResponse;
import com.hrsaas.recruitment.domain.entity.*;
import com.hrsaas.recruitment.repository.ApplicantRepository;
import com.hrsaas.recruitment.repository.ApplicationRepository;
import com.hrsaas.recruitment.repository.JobPostingRepository;
import com.hrsaas.recruitment.service.ApplicationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApplicationServiceImpl implements ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final JobPostingRepository jobPostingRepository;
    private final ApplicantRepository applicantRepository;

    private static final AtomicLong applicationSequence = new AtomicLong(1);

    @Override
    @Transactional
    public ApplicationResponse create(CreateApplicationRequest request) {
        log.info("Creating application for job: {} by applicant: {}",
                request.getJobPostingId(), request.getApplicantId());

        JobPosting jobPosting = jobPostingRepository.findById(request.getJobPostingId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "채용공고를 찾을 수 없습니다"));

        if (!jobPosting.isOpen()) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "마감된 채용공고입니다");
        }

        Applicant applicant = applicantRepository.findById(request.getApplicantId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "지원자를 찾을 수 없습니다"));

        if (applicant.isBlacklisted()) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "블랙리스트에 등록된 지원자입니다");
        }

        if (applicationRepository.existsByJobPostingIdAndApplicantId(
                request.getJobPostingId(), request.getApplicantId())) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "이미 지원한 공고입니다");
        }

        String applicationNumber = generateApplicationNumber();

        Application application = Application.builder()
                .jobPosting(jobPosting)
                .applicant(applicant)
                .applicationNumber(applicationNumber)
                .coverLetter(request.getCoverLetter())
                .answers(request.getAnswers())
                .expectedSalary(request.getExpectedSalary())
                .availableDate(request.getAvailableDate())
                .referrerName(request.getReferrerName())
                .referrerEmployeeId(request.getReferrerEmployeeId())
                .build();

        Application saved = applicationRepository.save(application);
        jobPosting.incrementApplicationCount();
        jobPostingRepository.save(jobPosting);

        log.info("Application created: {}", saved.getApplicationNumber());
        return ApplicationResponse.from(saved);
    }

    @Override
    public ApplicationResponse getById(UUID id) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "지원서를 찾을 수 없습니다: " + id));
        return ApplicationResponse.from(application);
    }

    @Override
    public ApplicationResponse getByApplicationNumber(String applicationNumber) {
        Application application = applicationRepository.findByApplicationNumber(applicationNumber)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "지원서를 찾을 수 없습니다: " + applicationNumber));
        return ApplicationResponse.from(application);
    }

    @Override
    public Page<ApplicationResponse> getByJobPostingId(UUID jobPostingId, Pageable pageable) {
        return applicationRepository.findByJobPostingIdOrderByCreatedAtDesc(jobPostingId, pageable)
                .map(ApplicationResponse::from);
    }

    @Override
    public Page<ApplicationResponse> getByApplicantId(UUID applicantId, Pageable pageable) {
        return applicationRepository.findByApplicantIdOrderByCreatedAtDesc(applicantId, pageable)
                .map(ApplicationResponse::from);
    }

    @Override
    public Page<ApplicationResponse> getByStatus(ApplicationStatus status, Pageable pageable) {
        return applicationRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                .map(ApplicationResponse::from);
    }

    @Override
    public Page<ApplicationResponse> getByCurrentStage(String stage, Pageable pageable) {
        return applicationRepository.findByCurrentStageOrderByCreatedAtDesc(stage, pageable)
                .map(ApplicationResponse::from);
    }

    @Override
    @Transactional
    public ApplicationResponse screen(UUID id, ScreenApplicationRequest request) {
        log.info("Screening application: {}", id);

        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "지원서를 찾을 수 없습니다"));

        if (application.getStatus() != ApplicationStatus.SUBMITTED) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "서류 심사 가능한 상태가 아닙니다");
        }

        application.screen(request.getScreenedBy(), request.getScore(), request.getNotes(), request.getPassed());
        Application saved = applicationRepository.save(application);

        log.info("Application screened: {} - {}", id, request.getPassed() ? "PASSED" : "REJECTED");
        return ApplicationResponse.from(saved);
    }

    @Override
    @Transactional
    public ApplicationResponse reject(UUID id, String reason) {
        log.info("Rejecting application: {}", id);

        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "지원서를 찾을 수 없습니다"));

        application.reject(reason);
        return ApplicationResponse.from(applicationRepository.save(application));
    }

    @Override
    @Transactional
    public ApplicationResponse withdraw(UUID id) {
        log.info("Withdrawing application: {}", id);

        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "지원서를 찾을 수 없습니다"));

        application.withdraw();
        return ApplicationResponse.from(applicationRepository.save(application));
    }

    @Override
    @Transactional
    public ApplicationResponse hire(UUID id) {
        log.info("Hiring application: {}", id);

        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "지원서를 찾을 수 없습니다"));

        application.hire();
        return ApplicationResponse.from(applicationRepository.save(application));
    }

    @Override
    @Transactional
    public ApplicationResponse moveToNextStage(UUID id, String stageName, int order) {
        log.info("Moving application {} to stage: {}", id, stageName);

        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "지원서를 찾을 수 없습니다"));

        application.moveToNextStage(stageName, order);
        return ApplicationResponse.from(applicationRepository.save(application));
    }

    @Override
    public ApplicationSummaryResponse getSummary() {
        // 10개 개별 COUNT 쿼리를 1개 GROUP BY 쿼리로 통합
        Map<ApplicationStatus, Long> statusCounts = new EnumMap<>(ApplicationStatus.class);
        long total = 0;
        for (Object[] row : applicationRepository.countGroupByStatus()) {
            ApplicationStatus status = (ApplicationStatus) row[0];
            Long count = (Long) row[1];
            statusCounts.put(status, count);
            total += count;
        }

        return ApplicationSummaryResponse.builder()
                .total(total)
                .submitted(statusCounts.getOrDefault(ApplicationStatus.SUBMITTED, 0L))
                .screening(statusCounts.getOrDefault(ApplicationStatus.SCREENING, 0L))
                .screened(statusCounts.getOrDefault(ApplicationStatus.SCREENED, 0L))
                .interviewing(statusCounts.getOrDefault(ApplicationStatus.INTERVIEWING, 0L))
                .interviewPassed(statusCounts.getOrDefault(ApplicationStatus.INTERVIEW_PASSED, 0L))
                .offerPending(statusCounts.getOrDefault(ApplicationStatus.OFFER_PENDING, 0L))
                .hired(statusCounts.getOrDefault(ApplicationStatus.HIRED, 0L))
                .rejected(statusCounts.getOrDefault(ApplicationStatus.REJECTED, 0L))
                .withdrawn(statusCounts.getOrDefault(ApplicationStatus.WITHDRAWN, 0L))
                .build();
    }

    @Override
    public List<ApplicationStageCountResponse> getStageCountsByJob(UUID jobPostingId) {
        List<Object[]> results = applicationRepository.countByJobPostingIdGroupByCurrentStage(jobPostingId);
        return results.stream()
                .map(row -> ApplicationStageCountResponse.builder()
                        .stage((String) row[0])
                        .count((Long) row[1])
                        .build())
                .collect(Collectors.toList());
    }

    private String generateApplicationNumber() {
        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long sequence = applicationSequence.getAndIncrement();
        return String.format("APP-%s-%06d", datePrefix, sequence);
    }
}
