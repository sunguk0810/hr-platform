package com.hrsaas.recruitment.service;

import com.hrsaas.recruitment.domain.dto.request.CreateJobPostingRequest;
import com.hrsaas.recruitment.domain.dto.request.UpdateJobPostingRequest;
import com.hrsaas.recruitment.domain.dto.response.JobPostingResponse;
import com.hrsaas.recruitment.domain.dto.response.JobPostingSummaryResponse;
import com.hrsaas.recruitment.domain.entity.JobStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * 채용공고 서비스 인터페이스
 */
public interface JobPostingService {

    JobPostingResponse create(CreateJobPostingRequest request);

    JobPostingResponse getById(UUID id);

    JobPostingResponse getByJobCode(String jobCode);

    Page<JobPostingResponse> getAll(Pageable pageable);

    Page<JobPostingResponse> getByStatus(JobStatus status, Pageable pageable);

    Page<JobPostingResponse> getActivePostings(Pageable pageable);

    Page<JobPostingResponse> getByDepartmentId(UUID departmentId, Pageable pageable);

    Page<JobPostingResponse> getByRecruiterId(UUID recruiterId, Pageable pageable);

    Page<JobPostingResponse> search(String keyword, Pageable pageable);

    JobPostingResponse update(UUID id, UpdateJobPostingRequest request);

    void delete(UUID id);

    JobPostingResponse publish(UUID id);

    JobPostingResponse close(UUID id);

    JobPostingResponse complete(UUID id);

    void incrementViewCount(UUID id);

    JobPostingSummaryResponse getSummary();
}
