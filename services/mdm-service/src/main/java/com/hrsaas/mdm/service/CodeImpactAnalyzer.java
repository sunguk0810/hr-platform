package com.hrsaas.mdm.service;

import com.hrsaas.mdm.domain.dto.response.CodeImpactResponse;

import java.util.UUID;

/**
 * 코드 변경 영향도 분석 서비스
 * 코드 변경이 시스템에 미치는 영향을 분석합니다.
 */
public interface CodeImpactAnalyzer {

    /**
     * 코드 변경 영향도 분석
     * @param codeId 분석할 코드 ID
     * @return 영향도 분석 결과
     */
    CodeImpactResponse analyzeImpact(UUID codeId);

    /**
     * 코드 삭제 영향도 분석
     * @param codeId 삭제할 코드 ID
     * @return 영향도 분석 결과
     */
    CodeImpactResponse analyzeDeletionImpact(UUID codeId);

    /**
     * 코드 폐기(deprecation) 영향도 분석
     * @param codeId 폐기할 코드 ID
     * @return 영향도 분석 결과
     */
    CodeImpactResponse analyzeDeprecationImpact(UUID codeId);

    /**
     * 코드 상태 변경 가능 여부 확인
     * @param codeId 코드 ID
     * @return 변경 가능 여부
     */
    boolean canChangeStatus(UUID codeId);

    /**
     * 코드 삭제 가능 여부 확인
     * @param codeId 코드 ID
     * @return 삭제 가능 여부
     */
    boolean canDelete(UUID codeId);
}
