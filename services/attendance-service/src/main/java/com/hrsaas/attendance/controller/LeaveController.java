package com.hrsaas.attendance.controller;

import com.hrsaas.attendance.domain.dto.request.CreateLeaveRequest;
import com.hrsaas.attendance.domain.dto.response.LeaveBalanceResponse;
import com.hrsaas.attendance.domain.dto.response.LeaveRequestResponse;
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
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
        return ApiResponse.success(leaveService.getById(id));
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
}
