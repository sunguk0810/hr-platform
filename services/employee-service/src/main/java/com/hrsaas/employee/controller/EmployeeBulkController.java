package com.hrsaas.employee.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.employee.domain.dto.request.BulkEmployeeImportRequest;
import com.hrsaas.employee.domain.dto.response.BulkImportResultResponse;
import com.hrsaas.employee.service.EmployeeBulkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/employees/bulk")
@RequiredArgsConstructor
@Tag(name = "Employee Bulk Import", description = "직원 일괄등록 API")
public class EmployeeBulkController {

    private final EmployeeBulkService employeeBulkService;

    @PostMapping
    @Operation(summary = "직원 일괄등록", description = "JSON 형태의 직원 데이터를 일괄 등록합니다.")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<BulkImportResultResponse>> importEmployees(
            @Valid @RequestBody BulkEmployeeImportRequest request) {
        BulkImportResultResponse response = employeeBulkService.importEmployees(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/validate")
    @Operation(summary = "직원 일괄등록 검증", description = "실제 저장 없이 등록 데이터를 검증합니다.")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<BulkImportResultResponse>> validateImport(
            @Valid @RequestBody BulkEmployeeImportRequest request) {
        request.setValidateOnly(true);
        BulkImportResultResponse response = employeeBulkService.validateImport(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
