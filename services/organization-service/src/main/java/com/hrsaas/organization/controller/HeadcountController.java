package com.hrsaas.organization.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.organization.domain.dto.request.CreateHeadcountPlanRequest;
import com.hrsaas.organization.domain.dto.request.CreateHeadcountRequestRequest;
import com.hrsaas.organization.domain.dto.request.UpdateHeadcountPlanRequest;
import com.hrsaas.organization.domain.dto.request.UpdateHeadcountRequestRequest;
import com.hrsaas.organization.domain.dto.response.HeadcountPlanResponse;
import com.hrsaas.organization.domain.dto.response.HeadcountRequestResponse;
import com.hrsaas.organization.domain.dto.response.HeadcountSummaryResponse;
import com.hrsaas.organization.domain.entity.HeadcountHistory;
import com.hrsaas.organization.domain.entity.HeadcountRequestStatus;
import com.hrsaas.organization.service.HeadcountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/headcounts")
@RequiredArgsConstructor
@Tag(name = "Headcount", description = "정현원 관리 API")
public class HeadcountController {

    private final HeadcountService headcountService;

    // Plan endpoints

    @PostMapping("/plans")
    @Operation(summary = "정현원 계획 생성")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<HeadcountPlanResponse>> createPlan(
            @Valid @RequestBody CreateHeadcountPlanRequest request) {
        HeadcountPlanResponse response = headcountService.createPlan(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/plans/{id}")
    @Operation(summary = "정현원 계획 상세 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<HeadcountPlanResponse>> getPlanById(@PathVariable UUID id) {
        HeadcountPlanResponse response = headcountService.getPlanById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/plans")
    @Operation(summary = "정현원 계획 목록 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<HeadcountPlanResponse>>> getPlansByYear(
            @RequestParam(required = false) Integer year) {
        int targetYear = year != null ? year : LocalDate.now().getYear();
        List<HeadcountPlanResponse> response = headcountService.getPlansByYear(targetYear);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/plans/{id}")
    @Operation(summary = "정현원 계획 수정")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<HeadcountPlanResponse>> updatePlan(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateHeadcountPlanRequest request) {
        HeadcountPlanResponse response = headcountService.updatePlan(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/plans/{id}")
    @Operation(summary = "정현원 계획 삭제")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePlan(@PathVariable UUID id) {
        headcountService.deletePlan(id);
        return ResponseEntity.ok(ApiResponse.success(null, "정현원 계획이 삭제되었습니다."));
    }

    @PostMapping("/plans/{id}/approve")
    @Operation(summary = "정현원 계획 승인")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<HeadcountPlanResponse>> approvePlan(@PathVariable UUID id) {
        HeadcountPlanResponse response = headcountService.approvePlan(id);
        return ResponseEntity.ok(ApiResponse.success(response, "정현원 계획이 승인되었습니다."));
    }

    @GetMapping("/plans/{id}/history")
    @Operation(summary = "정원 계획 이력 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<HeadcountHistory>>> getPlanHistory(@PathVariable UUID id) {
        List<HeadcountHistory> history = headcountService.getPlanHistory(id);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    // Request endpoints

    @PostMapping("/requests")
    @Operation(summary = "정현원 변경 요청 생성")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<HeadcountRequestResponse>> createRequest(
            @Valid @RequestBody CreateHeadcountRequestRequest request) {
        HeadcountRequestResponse response = headcountService.createRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/requests/{id}")
    @Operation(summary = "정현원 변경 요청 상세 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<HeadcountRequestResponse>> getRequestById(@PathVariable UUID id) {
        HeadcountRequestResponse response = headcountService.getRequestById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/requests")
    @Operation(summary = "정현원 변경 요청 목록 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<HeadcountRequestResponse>>> getAllRequests(
            @RequestParam(required = false) HeadcountRequestStatus status,
            @RequestParam(required = false) UUID departmentId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        if (status != null) {
            List<HeadcountRequestResponse> list = headcountService.getRequestsByStatus(status);
            return ResponseEntity.ok(ApiResponse.success(PageResponse.from(new org.springframework.data.domain.PageImpl<>(list))));
        } else if (departmentId != null) {
            List<HeadcountRequestResponse> list = headcountService.getRequestsByDepartment(departmentId);
            return ResponseEntity.ok(ApiResponse.success(PageResponse.from(new org.springframework.data.domain.PageImpl<>(list))));
        } else {
            Page<HeadcountRequestResponse> page = headcountService.getAllRequests(pageable);
            return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
        }
    }

    @PutMapping("/requests/{id}")
    @Operation(summary = "정현원 변경 요청 수정")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<HeadcountRequestResponse>> updateRequest(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateHeadcountRequestRequest request) {
        HeadcountRequestResponse response = headcountService.updateRequest(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/requests/{id}")
    @Operation(summary = "정현원 변경 요청 삭제")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteRequest(@PathVariable UUID id) {
        headcountService.deleteRequest(id);
        return ResponseEntity.ok(ApiResponse.success(null, "정현원 변경 요청이 삭제되었습니다."));
    }

    @PostMapping("/requests/{id}/submit")
    @Operation(summary = "정현원 변경 요청 제출")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> submitRequest(@PathVariable UUID id) {
        headcountService.submitRequest(id);
        return ResponseEntity.ok(ApiResponse.success(null, "정현원 변경 요청이 제출되었습니다."));
    }

    @PostMapping("/requests/{id}/cancel")
    @Operation(summary = "정현원 변경 요청 취소")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> cancelRequest(@PathVariable UUID id) {
        headcountService.cancelRequest(id);
        return ResponseEntity.ok(ApiResponse.success(null, "정현원 변경 요청이 취소되었습니다."));
    }

    @PostMapping("/requests/{id}/approve")
    @Operation(summary = "정현원 변경 요청 승인")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<HeadcountRequestResponse>> approveRequest(@PathVariable UUID id) {
        HeadcountRequestResponse response = headcountService.approveRequest(id);
        return ResponseEntity.ok(ApiResponse.success(response, "정현원 변경 요청이 승인되었습니다."));
    }

    @PostMapping("/requests/{id}/reject")
    @Operation(summary = "정현원 변경 요청 반려")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<HeadcountRequestResponse>> rejectRequest(
            @PathVariable UUID id,
            @RequestBody java.util.Map<String, String> body) {
        String reason = body.getOrDefault("reason", "");
        HeadcountRequestResponse response = headcountService.rejectRequest(id, reason);
        return ResponseEntity.ok(ApiResponse.success(response, "정현원 변경 요청이 반려되었습니다."));
    }

    // Summary endpoint

    @GetMapping("/summary")
    @Operation(summary = "정현원 현황 요약 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<HeadcountSummaryResponse>> getSummary(
            @RequestParam(required = false) Integer year) {
        int targetYear = year != null ? year : LocalDate.now().getYear();
        HeadcountSummaryResponse response = headcountService.getSummary(targetYear);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
