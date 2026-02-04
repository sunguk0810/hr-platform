package com.hrsaas.employee.service;

import com.hrsaas.employee.domain.dto.request.BulkEmployeeImportRequest;
import com.hrsaas.employee.domain.dto.response.BulkImportResultResponse;

/**
 * 직원 일괄등록 서비스 인터페이스
 */
public interface EmployeeBulkService {

    /**
     * 직원 일괄등록
     *
     * @param request 일괄등록 요청
     * @return 등록 결과
     */
    BulkImportResultResponse importEmployees(BulkEmployeeImportRequest request);

    /**
     * 직원 일괄등록 검증 (실제 저장하지 않음)
     *
     * @param request 일괄등록 요청
     * @return 검증 결과
     */
    BulkImportResultResponse validateImport(BulkEmployeeImportRequest request);
}
