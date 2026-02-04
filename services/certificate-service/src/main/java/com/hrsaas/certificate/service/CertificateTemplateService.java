package com.hrsaas.certificate.service;

import com.hrsaas.certificate.domain.dto.request.CreateCertificateTemplateRequest;
import com.hrsaas.certificate.domain.dto.request.UpdateCertificateTemplateRequest;
import com.hrsaas.certificate.domain.dto.response.CertificateTemplateResponse;

import java.util.List;
import java.util.UUID;

/**
 * 증명서 템플릿 서비스 인터페이스
 */
public interface CertificateTemplateService {

    /**
     * 템플릿 생성
     */
    CertificateTemplateResponse create(CreateCertificateTemplateRequest request);

    /**
     * 템플릿 조회
     */
    CertificateTemplateResponse getById(UUID id);

    /**
     * 이름으로 템플릿 조회
     */
    CertificateTemplateResponse getByName(String name);

    /**
     * 전체 템플릿 목록 조회
     */
    List<CertificateTemplateResponse> getAll();

    /**
     * 활성화된 템플릿 목록 조회
     */
    List<CertificateTemplateResponse> getActiveTemplates();

    /**
     * 템플릿 수정
     */
    CertificateTemplateResponse update(UUID id, UpdateCertificateTemplateRequest request);

    /**
     * 템플릿 삭제
     */
    void delete(UUID id);

    /**
     * 템플릿 활성화
     */
    void activate(UUID id);

    /**
     * 템플릿 비활성화
     */
    void deactivate(UUID id);

    /**
     * 템플릿 검색
     */
    List<CertificateTemplateResponse> search(String keyword);

    /**
     * 템플릿 미리보기 HTML 생성
     */
    String generatePreviewHtml(UUID id);
}
