package com.hrsaas.mdm.service;

import com.hrsaas.mdm.domain.dto.request.CodeImportBatchRequest;
import com.hrsaas.mdm.domain.dto.response.CodeExportResponse;
import com.hrsaas.mdm.domain.dto.response.ImportResultResponse;

import java.util.List;

/**
 * 코드 임포트/엑스포트 서비스 인터페이스
 */
public interface CodeImportExportService {

    /**
     * 코드 일괄 임포트
     *
     * @param request 임포트 요청
     * @return 임포트 결과
     */
    ImportResultResponse importCodes(CodeImportBatchRequest request);

    /**
     * 코드 임포트 검증 (실제 저장하지 않음)
     *
     * @param request 임포트 요청
     * @return 검증 결과
     */
    ImportResultResponse validateImport(CodeImportBatchRequest request);

    /**
     * 전체 코드 엑스포트
     *
     * @return 엑스포트 데이터
     */
    CodeExportResponse exportAll();

    /**
     * 특정 코드 그룹만 엑스포트
     *
     * @param groupCodes 엑스포트할 그룹 코드 목록
     * @return 엑스포트 데이터
     */
    CodeExportResponse exportByGroups(List<String> groupCodes);

    /**
     * 시스템 코드만 엑스포트
     *
     * @return 엑스포트 데이터
     */
    CodeExportResponse exportSystemCodes();
}
