package com.hrsaas.attendance.controller;

import com.hrsaas.attendance.domain.dto.request.*;
import com.hrsaas.attendance.domain.dto.response.*;
import com.hrsaas.attendance.domain.entity.LeaveType;
import com.hrsaas.attendance.service.LeaveService;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.security.UserContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/leaves")
@RequiredArgsConstructor
@Tag(name = "Leave", description = "휴가 관리 API")
public class LeaveController {

    private final LeaveService leaveService;

    @Operation(summary = "휴가 신청")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<LeaveRequestResponse> create(
            @Valid @RequestBody CreateLeaveRequest request) {
        UserContext user = SecurityContextHolder.getCurrentUser();
        return ApiResponse.success(leaveService.create(request, user.getUserId(),
                user.getEmployeeName(), user.getDepartmentId(), user.getDepartmentName()));
    }

    @Operation(summary = "휴가 상세 조회")
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<LeaveRequestResponse> getById(@PathVariable UUID id) {
        UserContext user = SecurityContextHolder.getCurrentUser();
        return ApiResponse.success(leaveService.getById(id, user.getUserId(), user.getRoles()));
    }

    @Operation(summary = "내 휴가 목록")
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PageResponse<LeaveRequestResponse>> getMyLeaves(
            @PageableDefault(size = 20) Pageable pageable) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(leaveService.getMyLeaves(userId, pageable));
    }

    @Operation(summary = "내 휴가 잔여일수")
    @GetMapping("/my/balances")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<LeaveBalanceResponse>> getMyBalances(
            @RequestParam(required = false) Integer year) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        int targetYear = year != null ? year : Year.now().getValue();
        return ApiResponse.success(leaveService.getMyBalances(userId, targetYear));
    }

    @Operation(summary = "휴가 제출")
    @PostMapping("/{id}/submit")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<LeaveRequestResponse> submit(@PathVariable UUID id) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(leaveService.submit(id, userId));
    }

    @Operation(summary = "휴가 취소")
    @PostMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<LeaveRequestResponse> cancel(@PathVariable UUID id) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(leaveService.cancel(id, userId));
    }

    // ===== Admin APIs =====

    @Operation(summary = "승인 대기 휴가 목록")
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<PageResponse<PendingLeaveResponse>> getPendingLeaves(
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) LeaveType leaveType,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(leaveService.getPendingLeaves(departmentId, leaveType, pageable));
    }

    @Operation(summary = "승인 대기 통계")
    @GetMapping("/pending/summary")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<PendingLeaveSummaryResponse> getPendingSummary() {
        return ApiResponse.success(leaveService.getPendingSummary());
    }

    @Operation(summary = "휴가 승인 (관리자)")
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<LeaveRequestResponse> adminApprove(
            @PathVariable UUID id,
            @RequestBody(required = false) ApproveLeaveAdminRequest request) {
        UUID adminId = SecurityContextHolder.getCurrentUser().getUserId();
        String comment = request != null ? request.getComment() : null;
        return ApiResponse.success(leaveService.adminApprove(id, comment, adminId));
    }

    @Operation(summary = "휴가 반려 (관리자)")
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<LeaveRequestResponse> adminReject(
            @PathVariable UUID id,
            @Valid @RequestBody RejectLeaveAdminRequest request) {
        UUID adminId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(leaveService.adminReject(id, request.getReason(), adminId));
    }

    @Operation(summary = "휴가 일괄 승인 (관리자)")
    @PostMapping("/bulk-approve")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<BulkOperationResponse> bulkApprove(
            @Valid @RequestBody BulkApproveLeaveRequest request) {
        UUID adminId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(leaveService.bulkApprove(
                request.getLeaveRequestIds(), request.getComment(), adminId));
    }

    @Operation(summary = "휴가 일괄 반려 (관리자)")
    @PostMapping("/bulk-reject")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<BulkOperationResponse> bulkReject(
            @Valid @RequestBody BulkRejectLeaveRequest request) {
        UUID adminId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(leaveService.bulkReject(
                request.getLeaveRequestIds(), request.getReason(), adminId));
    }

    @Operation(summary = "유형별 휴가 잔여일수")
    @GetMapping("/balance/by-type")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<LeaveBalanceResponse>> getBalanceByType(
            @RequestParam(required = false) Integer year) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        int targetYear = year != null ? year : Year.now().getValue();
        return ApiResponse.success(leaveService.getBalanceByType(userId, targetYear));
    }

    @Operation(summary = "팀 휴가 캘린더")
    @GetMapping("/calendar")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<LeaveCalendarEventResponse>> getCalendarEvents(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) UUID departmentId) {
        return ApiResponse.success(leaveService.getCalendarEvents(startDate, endDate, departmentId));
    }
}
