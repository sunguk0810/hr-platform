package com.hrsaas.mdm.service;

import com.hrsaas.mdm.domain.dto.response.ImportResultResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Excel 기반 코드 임포트/엑스포트 서비스
 */
public interface ExcelCodeImportExportService {

    /**
     * Excel 파일로 코드 엑스포트
     * @param groupCodes 엑스포트할 그룹 코드 목록 (null이면 전체)
     * @return Excel 바이트 배열
     */
    byte[] exportToExcel(List<String> groupCodes);

    /**
     * 시스템 코드만 Excel로 엑스포트
     */
    byte[] exportSystemCodesToExcel();

    /**
     * 임포트 템플릿 생성
     */
    byte[] generateImportTemplate();

    /**
     * Excel 파일에서 코드 임포트
     * @param file Excel 파일
     * @param overwrite 기존 코드 덮어쓰기 여부
     * @param validateOnly 검증만 수행 여부
     * @return 임포트 결과
     */
    ImportResultResponse importFromExcel(MultipartFile file, boolean overwrite, boolean validateOnly);
}
