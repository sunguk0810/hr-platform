package com.hrsaas.mdm.service;

import com.hrsaas.mdm.domain.dto.request.UpdateTenantCodeRequest;
import com.hrsaas.mdm.domain.dto.response.TenantCodeResponse;

import java.util.List;
import java.util.UUID;

/**
 * 테넌트별 코드 커스터마이징 서비스
 */
public interface TenantCodeService {

    /**
     * 테넌트별 코드 설정 조회
     */
    TenantCodeResponse getByCodeId(UUID codeId);

    /**
     * 그룹별 테넌트 코드 설정 목록 조회
     */
    List<TenantCodeResponse> getByGroupCode(String groupCode);

    /**
     * 테넌트별 코드 설정 수정 (커스터마이징)
     */
    TenantCodeResponse update(UUID codeId, UpdateTenantCodeRequest request);

    /**
     * 코드 숨기기
     */
    TenantCodeResponse hide(UUID codeId);

    /**
     * 코드 보이기
     */
    TenantCodeResponse show(UUID codeId);

    /**
     * 테넌트별 코드 커스터마이징 초기화 (원본으로 복원)
     */
    void resetToDefault(UUID codeId);
}
