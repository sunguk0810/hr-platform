package com.hrsaas.recruitment.service;

import com.hrsaas.recruitment.domain.dto.request.CreateApplicationRequest;
import com.hrsaas.recruitment.domain.dto.request.ScreenApplicationRequest;
import com.hrsaas.recruitment.domain.dto.response.ApplicationResponse;
import com.hrsaas.recruitment.domain.entity.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * 지원서 서비스 인터페이스
 */
public interface ApplicationService {

    ApplicationResponse create(CreateApplicationRequest request);

    ApplicationResponse getById(UUID id);

    ApplicationResponse getByApplicationNumber(String applicationNumber);

    Page<ApplicationResponse> getByJobPostingId(UUID jobPostingId, Pageable pageable);

    Page<ApplicationResponse> getByApplicantId(UUID applicantId, Pageable pageable);

    Page<ApplicationResponse> getByStatus(ApplicationStatus status, Pageable pageable);

    Page<ApplicationResponse> getByCurrentStage(String stage, Pageable pageable);

    ApplicationResponse screen(UUID id, ScreenApplicationRequest request);

    ApplicationResponse reject(UUID id, String reason);

    ApplicationResponse withdraw(UUID id);

    ApplicationResponse hire(UUID id);

    ApplicationResponse moveToNextStage(UUID id, String stageName, int order);
}
