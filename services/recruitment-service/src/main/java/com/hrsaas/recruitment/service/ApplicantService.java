package com.hrsaas.recruitment.service;

import com.hrsaas.recruitment.domain.dto.request.CreateApplicantRequest;
import com.hrsaas.recruitment.domain.dto.response.ApplicantResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * 지원자 서비스 인터페이스
 */
public interface ApplicantService {

    ApplicantResponse create(CreateApplicantRequest request);

    ApplicantResponse getById(UUID id);

    ApplicantResponse getByEmail(String email);

    Page<ApplicantResponse> getAll(Pageable pageable);

    Page<ApplicantResponse> search(String keyword, Pageable pageable);

    Page<ApplicantResponse> getBlacklisted(Pageable pageable);

    ApplicantResponse update(UUID id, CreateApplicantRequest request);

    void delete(UUID id);

    void blacklist(UUID id, String reason);

    void unblacklist(UUID id);
}
