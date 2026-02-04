package com.hrsaas.certificate.service;

import com.hrsaas.certificate.domain.dto.request.CreateCertificateTypeRequest;
import com.hrsaas.certificate.domain.dto.request.UpdateCertificateTypeRequest;
import com.hrsaas.certificate.domain.dto.response.CertificateTypeResponse;

import java.util.List;
import java.util.UUID;

/**
 * 증명서 유형 서비스 인터페이스
 */
public interface CertificateTypeService {

    /**
     * 증명서 유형 생성
     */
    CertificateTypeResponse create(CreateCertificateTypeRequest request);

    /**
     * 증명서 유형 조회
     */
    CertificateTypeResponse getById(UUID id);

    /**
     * 코드로 증명서 유형 조회
     */
    CertificateTypeResponse getByCode(String code);

    /**
     * 전체 증명서 유형 목록 조회
     */
    List<CertificateTypeResponse> getAll();

    /**
     * 활성화된 증명서 유형 목록 조회
     */
    List<CertificateTypeResponse> getActiveTypes();

    /**
     * 증명서 유형 수정
     */
    CertificateTypeResponse update(UUID id, UpdateCertificateTypeRequest request);

    /**
     * 증명서 유형 삭제
     */
    void delete(UUID id);

    /**
     * 증명서 유형 활성화
     */
    void activate(UUID id);

    /**
     * 증명서 유형 비활성화
     */
    void deactivate(UUID id);

    /**
     * 증명서 유형명으로 검색
     */
    List<CertificateTypeResponse> search(String keyword);
}
