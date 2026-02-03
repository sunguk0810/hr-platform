package com.hrsaas.attendance.controller;

import com.hrsaas.attendance.domain.dto.request.CreateLeaveRequest;
import com.hrsaas.attendance.domain.dto.response.LeaveBalanceResponse;
import com.hrsaas.attendance.domain.dto.response.LeaveRequestResponse;
import com.hrsaas.attendance.service.LeaveService;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Year;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/leaves")
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveService leaveService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<LeaveRequestResponse> create(
            @Valid @RequestBody CreateLeaveRequest request,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-Department-ID", required = false) UUID departmentId,
            @RequestHeader(value = "X-Department-Name", required = false) String departmentName) {
        return ApiResponse.success(leaveService.create(request, userId, userName, departmentId, departmentName));
    }

    @GetMapping("/{id}")
    public ApiResponse<LeaveRequestResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(leaveService.getById(id));
    }

    @GetMapping("/my")
    public ApiResponse<PageResponse<LeaveRequestResponse>> getMyLeaves(
            @RequestHeader("X-User-ID") UUID userId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(leaveService.getMyLeaves(userId, pageable));
    }

    @GetMapping("/my/balances")
    public ApiResponse<List<LeaveBalanceResponse>> getMyBalances(
            @RequestHeader("X-User-ID") UUID userId,
            @RequestParam(required = false) Integer year) {
        int targetYear = year != null ? year : Year.now().getValue();
        return ApiResponse.success(leaveService.getMyBalances(userId, targetYear));
    }

    @PostMapping("/{id}/submit")
    public ApiResponse<LeaveRequestResponse> submit(
            @PathVariable UUID id,
            @RequestHeader("X-User-ID") UUID userId) {
        return ApiResponse.success(leaveService.submit(id, userId));
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<LeaveRequestResponse> cancel(
            @PathVariable UUID id,
            @RequestHeader("X-User-ID") UUID userId) {
        return ApiResponse.success(leaveService.cancel(id, userId));
    }
}
