package com.hrsaas.employee.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.employee.domain.dto.request.CreateEmployeeFamilyRequest;
import com.hrsaas.employee.domain.dto.request.UpdateEmployeeFamilyRequest;
import com.hrsaas.employee.domain.dto.response.EmployeeFamilyResponse;
import com.hrsaas.employee.service.EmployeeFamilyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/employees/{employeeId}/family")
@RequiredArgsConstructor
@Tag(name = "Employee Family", description = "가족정보 관리 API")
public class EmployeeFamilyController {

    private final EmployeeFamilyService employeeFamilyService;

    @PostMapping
    @Operation(summary = "가족 정보 등록")
    public ResponseEntity<ApiResponse<EmployeeFamilyResponse>> create(
            @PathVariable UUID employeeId,
            @Valid @RequestBody CreateEmployeeFamilyRequest request) {
        EmployeeFamilyResponse response = employeeFamilyService.create(employeeId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping
    @Operation(summary = "가족 정보 목록 조회")
    public ResponseEntity<ApiResponse<List<EmployeeFamilyResponse>>> getByEmployeeId(
            @PathVariable UUID employeeId,
            @RequestParam(required = false, defaultValue = "false") boolean dependentsOnly) {
        List<EmployeeFamilyResponse> response = dependentsOnly
            ? employeeFamilyService.getDependents(employeeId)
            : employeeFamilyService.getByEmployeeId(employeeId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{familyId}")
    @Operation(summary = "가족 정보 수정")
    public ResponseEntity<ApiResponse<EmployeeFamilyResponse>> update(
            @PathVariable UUID employeeId,
            @PathVariable UUID familyId,
            @Valid @RequestBody UpdateEmployeeFamilyRequest request) {
        EmployeeFamilyResponse response = employeeFamilyService.update(employeeId, familyId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{familyId}")
    @Operation(summary = "가족 정보 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID employeeId,
            @PathVariable UUID familyId) {
        employeeFamilyService.delete(employeeId, familyId);
        return ResponseEntity.ok(ApiResponse.success(null, "가족 정보가 삭제되었습니다."));
    }
}
