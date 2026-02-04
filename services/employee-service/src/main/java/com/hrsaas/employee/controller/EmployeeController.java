package com.hrsaas.employee.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.employee.domain.dto.request.CreateEmployeeRequest;
import com.hrsaas.employee.domain.dto.request.EmployeeSearchCondition;
import com.hrsaas.employee.domain.dto.request.UpdateEmployeeRequest;
import com.hrsaas.employee.domain.dto.response.EmployeeResponse;
import com.hrsaas.employee.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
@Tag(name = "Employee", description = "직원 관리 API")
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping("/me")
    @Operation(summary = "내 정보 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getMe() {
        UUID employeeId = SecurityContextHolder.getCurrentEmployeeId();
        if (employeeId == null) {
            throw new IllegalStateException("Employee ID not found in security context");
        }
        EmployeeResponse response = employeeService.getById(employeeId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "직원 생성")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> create(
            @Valid @RequestBody CreateEmployeeRequest request) {
        EmployeeResponse response = employeeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "직원 상세 조회")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN') and @permissionChecker.canAccessEmployee(#id)")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getById(@PathVariable UUID id) {
        EmployeeResponse response = employeeService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/employee-number/{employeeNumber}")
    @Operation(summary = "사번으로 직원 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getByEmployeeNumber(
            @PathVariable String employeeNumber) {
        EmployeeResponse response = employeeService.getByEmployeeNumber(employeeNumber);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "직원 검색")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<EmployeeResponse>>> search(
            @ModelAttribute EmployeeSearchCondition condition,
            @PageableDefault(size = 20) Pageable pageable) {
        PageResponse<EmployeeResponse> response = employeeService.search(condition, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "직원 정보 수정")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN') or @permissionChecker.isSelf(#id)")
    public ResponseEntity<ApiResponse<EmployeeResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateEmployeeRequest request) {
        EmployeeResponse response = employeeService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/resign")
    @Operation(summary = "직원 퇴사 처리")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> resign(
            @PathVariable UUID id,
            @RequestParam String resignDate) {
        EmployeeResponse response = employeeService.resign(id, resignDate);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "직원 삭제")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        employeeService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "직원이 삭제되었습니다."));
    }
}
