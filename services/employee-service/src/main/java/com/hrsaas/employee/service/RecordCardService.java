package com.hrsaas.employee.service;

import com.hrsaas.employee.domain.dto.response.RecordCardResponse;

import java.util.UUID;

/**
 * 인사기록카드 서비스 인터페이스
 */
public interface RecordCardService {

    /**
     * 인사기록카드 조회
     *
     * @param employeeId 직원 ID
     * @return 인사기록카드 데이터
     */
    RecordCardResponse getRecordCard(UUID employeeId);

    /**
     * 인사기록카드 PDF 데이터 생성
     *
     * @param employeeId 직원 ID
     * @return PDF 바이트 배열
     */
    byte[] generateRecordCardPdf(UUID employeeId);
}
