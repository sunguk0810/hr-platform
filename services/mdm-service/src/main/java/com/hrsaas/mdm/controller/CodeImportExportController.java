package com.hrsaas.mdm.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.mdm.domain.dto.request.CodeImportBatchRequest;
import com.hrsaas.mdm.domain.dto.response.CodeExportResponse;
import com.hrsaas.mdm.domain.dto.response.ImportResultResponse;
import com.hrsaas.mdm.service.CodeImportExportService;
import com.hrsaas.mdm.service.ExcelCodeImportExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/mdm")
@RequiredArgsConstructor
@Tag(name = "Code Import/Export", description = "코드 임포트/엑스포트 API")
public class CodeImportExportController {

    private final CodeImportExportService codeImportExportService;
    private final ExcelCodeImportExportService excelCodeImportExportService;

    @PostMapping("/import")
    @Operation(summary = "코드 일괄 임포트", description = "JSON 형태의 코드 데이터를 일괄 임포트합니다.")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ImportResultResponse>> importCodes(
            @Valid @RequestBody CodeImportBatchRequest request) {
        ImportResultResponse response = codeImportExportService.importCodes(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/import/validate")
    @Operation(summary = "코드 임포트 검증", description = "실제 저장 없이 임포트 데이터를 검증합니다.")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ImportResultResponse>> validateImport(
            @Valid @RequestBody CodeImportBatchRequest request) {
        request.setValidateOnly(true);
        ImportResultResponse response = codeImportExportService.validateImport(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/export")
    @Operation(summary = "전체 코드 엑스포트", description = "현재 테넌트의 모든 코드를 엑스포트합니다.")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CodeExportResponse>> exportAll() {
        CodeExportResponse response = codeImportExportService.exportAll();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/export/groups")
    @Operation(summary = "특정 그룹 코드 엑스포트", description = "지정한 코드 그룹만 엑스포트합니다.")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CodeExportResponse>> exportByGroups(
            @Parameter(description = "엑스포트할 그룹 코드 목록")
            @RequestParam List<String> groupCodes) {
        CodeExportResponse response = codeImportExportService.exportByGroups(groupCodes);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/export/system")
    @Operation(summary = "시스템 코드 엑스포트", description = "시스템 코드만 엑스포트합니다.")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CodeExportResponse>> exportSystemCodes() {
        CodeExportResponse response = codeImportExportService.exportSystemCodes();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/import/excel")
    @Operation(summary = "Excel 코드 임포트", description = "Excel 파일에서 코드를 일괄 임포트합니다.")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ImportResultResponse>> importExcel(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "false") boolean overwrite,
            @RequestParam(defaultValue = "false") boolean validateOnly) {
        ImportResultResponse response = excelCodeImportExportService.importFromExcel(file, overwrite, validateOnly);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/export/excel")
    @Operation(summary = "Excel 코드 엑스포트", description = "코드를 Excel 파일로 다운로드합니다.")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam(required = false) List<String> groupCodes) {
        byte[] bytes = excelCodeImportExportService.exportToExcel(groupCodes);
        return ResponseEntity.ok()
            .header("Content-Disposition", "attachment; filename=codes.xlsx")
            .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
            .body(bytes);
    }

    @GetMapping("/export/excel/template")
    @Operation(summary = "Excel 임포트 템플릿 다운로드", description = "코드 임포트용 Excel 템플릿을 다운로드합니다.")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<byte[]> downloadTemplate() {
        byte[] bytes = excelCodeImportExportService.generateImportTemplate();
        return ResponseEntity.ok()
            .header("Content-Disposition", "attachment; filename=code_import_template.xlsx")
            .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
            .body(bytes);
    }
}
