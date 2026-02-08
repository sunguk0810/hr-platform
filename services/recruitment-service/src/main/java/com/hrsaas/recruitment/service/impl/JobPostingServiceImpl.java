package com.hrsaas.recruitment.service.impl;

import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.ErrorCode;
import com.hrsaas.recruitment.domain.dto.request.CreateJobPostingRequest;
import com.hrsaas.recruitment.domain.dto.request.UpdateJobPostingRequest;
import com.hrsaas.recruitment.domain.dto.response.JobPostingResponse;
import com.hrsaas.recruitment.domain.dto.response.JobPostingSummaryResponse;
import com.hrsaas.recruitment.domain.entity.JobPosting;
import com.hrsaas.recruitment.domain.entity.JobStatus;
import com.hrsaas.recruitment.repository.JobPostingRepository;
import com.hrsaas.recruitment.service.JobPostingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JobPostingServiceImpl implements JobPostingService {

    private final JobPostingRepository jobPostingRepository;

    @Override
    @Transactional
    @CacheEvict(value = "jobPostings", allEntries = true)
    public JobPostingResponse create(CreateJobPostingRequest request) {
        log.info("Creating job posting: {}", request.getJobCode());

        if (jobPostingRepository.existsByJobCode(request.getJobCode())) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "이미 존재하는 채용 코드입니다: " + request.getJobCode());
        }

        JobPosting jobPosting = JobPosting.builder()
                .jobCode(request.getJobCode())
                .title(request.getTitle())
                .departmentId(request.getDepartmentId())
                .departmentName(request.getDepartmentName())
                .positionId(request.getPositionId())
                .positionName(request.getPositionName())
                .jobDescription(request.getJobDescription())
                .requirements(request.getRequirements())
                .preferredQualifications(request.getPreferredQualifications())
                .employmentType(request.getEmploymentType())
                .experienceMin(request.getExperienceMin())
                .experienceMax(request.getExperienceMax())
                .salaryMin(request.getSalaryMin())
                .salaryMax(request.getSalaryMax())
                .salaryNegotiable(request.isSalaryNegotiable())
                .workLocation(request.getWorkLocation())
                .headcount(request.getHeadcount())
                .skills(request.getSkills())
                .benefits(request.getBenefits())
                .openDate(request.getOpenDate())
                .closeDate(request.getCloseDate())
                .recruiterId(request.getRecruiterId())
                .recruiterName(request.getRecruiterName())
                .hiringManagerId(request.getHiringManagerId())
                .hiringManagerName(request.getHiringManagerName())
                .featured(request.isFeatured())
                .urgent(request.isUrgent())
                .interviewProcess(request.getInterviewProcess())
                .build();

        JobPosting saved = jobPostingRepository.save(jobPosting);
        log.info("Job posting created: {}", saved.getId());

        return JobPostingResponse.from(saved);
    }

    @Override
    @Cacheable(value = "jobPosting", key = "#id")
    public JobPostingResponse getById(UUID id) {
        JobPosting jobPosting = jobPostingRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "채용공고를 찾을 수 없습니다: " + id));
        return JobPostingResponse.from(jobPosting);
    }

    @Override
    public JobPostingResponse getByJobCode(String jobCode) {
        JobPosting jobPosting = jobPostingRepository.findByJobCode(jobCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "채용공고를 찾을 수 없습니다: " + jobCode));
        return JobPostingResponse.from(jobPosting);
    }

    @Override
    public Page<JobPostingResponse> getAll(Pageable pageable) {
        return jobPostingRepository.findAll(pageable).map(JobPostingResponse::from);
    }

    @Override
    public Page<JobPostingResponse> getByStatus(JobStatus status, Pageable pageable) {
        return jobPostingRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                .map(JobPostingResponse::from);
    }

    @Override
    @Cacheable(value = "jobPostings", key = "'active'", unless = "#result == null || #result.isEmpty()")
    public Page<JobPostingResponse> getActivePostings(Pageable pageable) {
        return jobPostingRepository.findActiveJobPostings(LocalDate.now(), pageable)
                .map(JobPostingResponse::from);
    }

    @Override
    public Page<JobPostingResponse> getByDepartmentId(UUID departmentId, Pageable pageable) {
        return jobPostingRepository.findByDepartmentIdOrderByCreatedAtDesc(departmentId, pageable)
                .map(JobPostingResponse::from);
    }

    @Override
    public Page<JobPostingResponse> getByRecruiterId(UUID recruiterId, Pageable pageable) {
        return jobPostingRepository.findByRecruiterIdOrderByCreatedAtDesc(recruiterId, pageable)
                .map(JobPostingResponse::from);
    }

    @Override
    public Page<JobPostingResponse> search(String keyword, Pageable pageable) {
        return jobPostingRepository.searchByKeyword(keyword, JobStatus.PUBLISHED, pageable)
                .map(JobPostingResponse::from);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"jobPosting", "jobPostings"}, allEntries = true)
    public JobPostingResponse update(UUID id, UpdateJobPostingRequest request) {
        log.info("Updating job posting: {}", id);

        JobPosting jobPosting = jobPostingRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "채용공고를 찾을 수 없습니다: " + id));

        if (request.getTitle() != null) jobPosting.setTitle(request.getTitle());
        if (request.getDepartmentId() != null) jobPosting.setDepartmentId(request.getDepartmentId());
        if (request.getDepartmentName() != null) jobPosting.setDepartmentName(request.getDepartmentName());
        if (request.getJobDescription() != null) jobPosting.setJobDescription(request.getJobDescription());
        if (request.getRequirements() != null) jobPosting.setRequirements(request.getRequirements());
        if (request.getEmploymentType() != null) jobPosting.setEmploymentType(request.getEmploymentType());
        if (request.getSalaryMin() != null) jobPosting.setSalaryMin(request.getSalaryMin());
        if (request.getSalaryMax() != null) jobPosting.setSalaryMax(request.getSalaryMax());
        if (request.getWorkLocation() != null) jobPosting.setWorkLocation(request.getWorkLocation());
        if (request.getHeadcount() != null) jobPosting.setHeadcount(request.getHeadcount());
        if (request.getSkills() != null) jobPosting.setSkills(request.getSkills());
        if (request.getBenefits() != null) jobPosting.setBenefits(request.getBenefits());
        if (request.getCloseDate() != null) jobPosting.setCloseDate(request.getCloseDate());
        if (request.getFeatured() != null) jobPosting.setFeatured(request.getFeatured());
        if (request.getUrgent() != null) jobPosting.setUrgent(request.getUrgent());
        if (request.getInterviewProcess() != null) jobPosting.setInterviewProcess(request.getInterviewProcess());

        JobPosting saved = jobPostingRepository.save(jobPosting);
        return JobPostingResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"jobPosting", "jobPostings"}, allEntries = true)
    public void delete(UUID id) {
        log.info("Deleting job posting: {}", id);
        if (!jobPostingRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "채용공고를 찾을 수 없습니다: " + id);
        }
        jobPostingRepository.deleteById(id);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"jobPosting", "jobPostings"}, allEntries = true)
    public JobPostingResponse publish(UUID id) {
        log.info("Publishing job posting: {}", id);
        JobPosting jobPosting = jobPostingRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "채용공고를 찾을 수 없습니다: " + id));
        jobPosting.publish();
        return JobPostingResponse.from(jobPostingRepository.save(jobPosting));
    }

    @Override
    @Transactional
    @CacheEvict(value = {"jobPosting", "jobPostings"}, allEntries = true)
    public JobPostingResponse close(UUID id) {
        log.info("Closing job posting: {}", id);
        JobPosting jobPosting = jobPostingRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "채용공고를 찾을 수 없습니다: " + id));
        jobPosting.close();
        return JobPostingResponse.from(jobPostingRepository.save(jobPosting));
    }

    @Override
    @Transactional
    @CacheEvict(value = {"jobPosting", "jobPostings"}, allEntries = true)
    public JobPostingResponse complete(UUID id) {
        log.info("Completing job posting: {}", id);
        JobPosting jobPosting = jobPostingRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "채용공고를 찾을 수 없습니다: " + id));
        jobPosting.complete();
        return JobPostingResponse.from(jobPostingRepository.save(jobPosting));
    }

    @Override
    @Transactional
    public void incrementViewCount(UUID id) {
        JobPosting jobPosting = jobPostingRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "채용공고를 찾을 수 없습니다: " + id));
        jobPosting.incrementViewCount();
        jobPostingRepository.save(jobPosting);
    }

    @Override
    public JobPostingSummaryResponse getSummary() {
        return JobPostingSummaryResponse.builder()
                .total(jobPostingRepository.count())
                .draft(jobPostingRepository.countByStatus(JobStatus.DRAFT))
                .pending(jobPostingRepository.countByStatus(JobStatus.PENDING))
                .published(jobPostingRepository.countByStatus(JobStatus.PUBLISHED))
                .closed(jobPostingRepository.countByStatus(JobStatus.CLOSED))
                .cancelled(jobPostingRepository.countByStatus(JobStatus.CANCELLED))
                .completed(jobPostingRepository.countByStatus(JobStatus.COMPLETED))
                .build();
    }
}
