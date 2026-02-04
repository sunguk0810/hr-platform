package com.hrsaas.employee.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.employee.domain.dto.response.RecordCardResponse;
import com.hrsaas.employee.service.RecordCardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/employees/{employeeId}/record-card")
@RequiredArgsConstructor
@Tag(name = "Record Card", description = "인사기록카드 API")
public class RecordCardController {

    private final RecordCardService recordCardService;

    @GetMapping
    @Operation(summary = "인사기록카드 조회", description = "직원의 인사기록카드 정보를 조회합니다.")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<RecordCardResponse>> getRecordCard(
            @PathVariable UUID employeeId) {
        RecordCardResponse response = recordCardService.getRecordCard(employeeId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/pdf")
    @Operation(summary = "인사기록카드 PDF 다운로드", description = "직원의 인사기록카드를 PDF로 다운로드합니다.")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> downloadRecordCardPdf(
            @PathVariable UUID employeeId) {
        byte[] pdfContent = recordCardService.generateRecordCardPdf(employeeId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_HTML); // 실제 PDF 생성 시 APPLICATION_PDF로 변경
        headers.setContentDispositionFormData("attachment",
            "record-card-" + employeeId + ".html"); // 실제 PDF 생성 시 .pdf로 변경

        return ResponseEntity.ok()
            .headers(headers)
            .body(pdfContent);
    }
}
