package com.hrsaas.attendance.controller;

import com.hrsaas.attendance.domain.dto.request.CreateOvertimeRequest;
import com.hrsaas.attendance.domain.dto.response.OvertimeRequestResponse;
import com.hrsaas.attendance.domain.entity.OvertimeStatus;
import com.hrsaas.attendance.service.OvertimeService;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/overtimes")
@RequiredArgsConstructor
@Tag(name = "Overtime", description = "초과근무 신청 관리 API")
public class OvertimeController {

    private final OvertimeService overtimeService;

    @PostMapping
    @Operation(summary = "초과근무 신청")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<OvertimeRequestResponse>> create(
            @RequestHeader("X-User-ID") UUID employeeId,
            @RequestHeader("X-User-Name") String employeeName,
            @RequestHeader(value = "X-Department-ID", required = false) UUID departmentId,
            @RequestHeader(value = "X-Department-Name", required = false) String departmentName,
            @Valid @RequestBody CreateOvertimeRequest request) {
        OvertimeRequestResponse response = overtimeService.create(
            employeeId, employeeName, departmentId, departmentName, request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "초과근무 신청 상세 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<OvertimeRequestResponse>> getById(@PathVariable UUID id) {
        OvertimeRequestResponse response = overtimeService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my")
    @Operation(summary = "내 초과근무 신청 목록")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<OvertimeRequestResponse>>> getMyOvertimes(
            @RequestHeader("X-User-ID") UUID employeeId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<OvertimeRequestResponse> page = overtimeService.getByEmployeeId(employeeId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
    }

    @GetMapping("/my/status/{status}")
    @Operation(summary = "상태별 내 초과근무 신청 목록")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<OvertimeRequestResponse>>> getMyOvertimesByStatus(
            @RequestHeader("X-User-ID") UUID employeeId,
            @PathVariable OvertimeStatus status) {
        List<OvertimeRequestResponse> response = overtimeService.getByEmployeeIdAndStatus(employeeId, status);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/department/{departmentId}/pending")
    @Operation(summary = "부서별 승인 대기 초과근무 목록 (관리자용)")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<OvertimeRequestResponse>>> getDepartmentPendingOvertimes(
            @PathVariable UUID departmentId) {
        List<OvertimeRequestResponse> response = overtimeService.getByDepartmentIdAndStatus(
            departmentId, OvertimeStatus.PENDING);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "기간별 초과근무 목록 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<OvertimeRequestResponse>>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<OvertimeRequestResponse> response = overtimeService.getByDateRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "초과근무 승인")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<OvertimeRequestResponse>> approve(@PathVariable UUID id) {
        OvertimeRequestResponse response = overtimeService.approve(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "초과근무 반려")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<OvertimeRequestResponse>> reject(
            @PathVariable UUID id,
            @RequestParam String reason) {
        OvertimeRequestResponse response = overtimeService.reject(id, reason);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "초과근무 신청 취소")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<OvertimeRequestResponse>> cancel(@PathVariable UUID id) {
        OvertimeRequestResponse response = overtimeService.cancel(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "초과근무 완료 처리")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<OvertimeRequestResponse>> complete(
            @PathVariable UUID id,
            @RequestParam BigDecimal actualHours) {
        OvertimeRequestResponse response = overtimeService.complete(id, actualHours);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my/total-hours")
    @Operation(summary = "내 초과근무 총 시간 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalHours(
            @RequestHeader("X-User-ID") UUID employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        BigDecimal totalHours = overtimeService.getTotalOvertimeHours(employeeId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(totalHours));
    }
}
