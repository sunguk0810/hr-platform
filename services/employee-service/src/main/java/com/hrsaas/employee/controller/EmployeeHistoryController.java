package com.hrsaas.employee.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.employee.domain.dto.request.CreateEmployeeHistoryRequest;
import com.hrsaas.employee.domain.dto.response.EmployeeHistoryResponse;
import com.hrsaas.employee.domain.entity.HistoryChangeType;
import com.hrsaas.employee.service.EmployeeHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/employees/{employeeId}/histories")
@RequiredArgsConstructor
@Tag(name = "Employee History", description = "인사이력 관리 API")
public class EmployeeHistoryController {

    private final EmployeeHistoryService employeeHistoryService;

    @PostMapping
    @Operation(summary = "인사이력 등록")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeHistoryResponse>> create(
            @PathVariable UUID employeeId,
            @Valid @RequestBody CreateEmployeeHistoryRequest request) {
        EmployeeHistoryResponse response = employeeHistoryService.create(employeeId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping
    @Operation(summary = "인사이력 목록 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<EmployeeHistoryResponse>>> getByEmployeeId(
            @PathVariable UUID employeeId,
            @RequestParam(required = false) HistoryChangeType changeType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        List<EmployeeHistoryResponse> response;

        if (changeType != null) {
            response = employeeHistoryService.getByEmployeeIdAndChangeType(employeeId, changeType);
        } else if (startDate != null && endDate != null) {
            response = employeeHistoryService.getByEmployeeIdAndDateRange(employeeId, startDate, endDate);
        } else {
            response = employeeHistoryService.getByEmployeeId(employeeId);
        }

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
