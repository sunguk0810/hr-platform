package com.hrsaas.mdm.service;

import com.hrsaas.mdm.domain.dto.response.CodeHistoryResponse;
import com.hrsaas.mdm.domain.entity.CodeAction;
import com.hrsaas.mdm.domain.entity.CodeStatus;
import com.hrsaas.mdm.domain.entity.CommonCode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * 코드 변경 이력 서비스
 */
public interface CodeHistoryService {

    /**
     * 코드별 변경 이력 조회
     */
    List<CodeHistoryResponse> getByCodeId(UUID codeId);

    /**
     * 코드별 변경 이력 조회 (페이징)
     */
    Page<CodeHistoryResponse> getByCodeId(UUID codeId, Pageable pageable);

    /**
     * 그룹별 변경 이력 조회
     */
    List<CodeHistoryResponse> getByGroupCode(String groupCode);

    /**
     * 기간별 변경 이력 조회
     */
    Page<CodeHistoryResponse> getByDateRange(Instant startDate, Instant endDate, Pageable pageable);

    /**
     * 생성 이력 기록
     */
    void recordCreated(CommonCode code);

    /**
     * 필드 변경 이력 기록
     */
    void recordFieldChanged(CommonCode code, String fieldName, String oldValue, String newValue);

    /**
     * 상태 변경 이력 기록
     */
    void recordStatusChanged(CommonCode code, CodeAction action, CodeStatus oldStatus, CodeStatus newStatus);

    /**
     * 삭제 이력 기록
     */
    void recordDeleted(CommonCode code);
}
