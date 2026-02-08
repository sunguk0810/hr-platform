package com.hrsaas.employee.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.employee.domain.dto.request.*;
import com.hrsaas.employee.domain.dto.response.CondolencePolicyResponse;
import com.hrsaas.employee.domain.dto.response.CondolenceRequestResponse;
import com.hrsaas.employee.domain.entity.CondolenceStatus;
import com.hrsaas.employee.service.CondolenceService;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/condolences")
@RequiredArgsConstructor
@Tag(name = "Condolence", description = "경조비 관리 API")
public class CondolenceController {

    private final CondolenceService condolenceService;

    // Request endpoints

    @PostMapping
    @Operation(summary = "경조비 신청")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CondolenceRequestResponse>> createRequest(
            @Valid @RequestBody CreateCondolenceRequest request) {
        CondolenceRequestResponse response = condolenceService.createRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "경조비 신청 상세 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CondolenceRequestResponse>> getRequestById(@PathVariable UUID id) {
        CondolenceRequestResponse response = condolenceService.getRequestById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "경조비 신청 목록 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Page<CondolenceRequestResponse>>> getAllRequests(
            @RequestParam(required = false) CondolenceStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        if (status != null) {
            List<CondolenceRequestResponse> list = condolenceService.getRequestsByStatus(status);
            return ResponseEntity.ok(ApiResponse.success(new org.springframework.data.domain.PageImpl<>(list)));
        }
        Page<CondolenceRequestResponse> response = condolenceService.getAllRequests(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my")
    @Operation(summary = "내 경조비 신청 목록 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<CondolenceRequestResponse>>> getMyRequests() {
        List<CondolenceRequestResponse> response = condolenceService.getMyRequests();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "경조비 신청 수정")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CondolenceRequestResponse>> updateRequest(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCondolenceRequest request) {
        CondolenceRequestResponse response = condolenceService.updateRequest(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "경조비 신청 삭제")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteRequest(@PathVariable UUID id) {
        condolenceService.deleteRequest(id);
        return ResponseEntity.ok(ApiResponse.success(null, "경조비 신청이 삭제되었습니다."));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "경조비 신청 취소")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> cancelRequest(@PathVariable UUID id) {
        condolenceService.cancelRequest(id);
        return ResponseEntity.ok(ApiResponse.success(null, "경조비 신청이 취소되었습니다."));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "경조비 신청 승인")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CondolenceRequestResponse>> approveRequest(@PathVariable UUID id) {
        CondolenceRequestResponse response = condolenceService.approveRequest(id);
        return ResponseEntity.ok(ApiResponse.success(response, "경조비 신청이 승인되었습니다."));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "경조비 신청 반려")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CondolenceRequestResponse>> rejectRequest(
            @PathVariable UUID id,
            @RequestBody java.util.Map<String, String> body) {
        String reason = body.get("reason");
        CondolenceRequestResponse response = condolenceService.rejectRequest(id, reason);
        return ResponseEntity.ok(ApiResponse.success(response, "경조비 신청이 반려되었습니다."));
    }

    // Payment endpoints

    @PostMapping("/{id}/pay")
    @Operation(summary = "경조비 지급 처리")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CondolenceRequestResponse>> processPayment(
            @PathVariable UUID id,
            @RequestBody(required = false) ProcessPaymentRequest request) {
        java.time.LocalDate paidDate = request != null ? request.getPaidDate() : null;
        CondolenceRequestResponse response = condolenceService.processPayment(id, paidDate);
        return ResponseEntity.ok(ApiResponse.success(response, "경조비 지급이 처리되었습니다."));
    }

    @GetMapping("/payments/pending")
    @Operation(summary = "미지급 경조비 목록 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Page<CondolenceRequestResponse>>> getPendingPayments(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<CondolenceRequestResponse> response = condolenceService.getPendingPayments(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/payments/bulk")
    @Operation(summary = "경조비 일괄 지급 처리")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<java.util.Map<String, Integer>>> bulkProcessPayment(
            @Valid @RequestBody BulkProcessPaymentRequest request) {
        int processedCount = condolenceService.bulkProcessPayment(request.getCondolenceIds(), request.getPaidDate());
        return ResponseEntity.ok(ApiResponse.success(
            java.util.Map.of("processedCount", processedCount),
            processedCount + "건의 경조비 지급이 처리되었습니다."));
    }

    @GetMapping("/payments/history")
    @Operation(summary = "경조비 지급 이력 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Page<CondolenceRequestResponse>>> getPaymentHistory(
            @PageableDefault(size = 20, sort = "paidDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<CondolenceRequestResponse> response = condolenceService.getPaymentHistory(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // Policy endpoints

    @GetMapping("/policies")
    @Operation(summary = "경조비 정책 목록 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<CondolencePolicyResponse>>> getPolicies(
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly) {
        List<CondolencePolicyResponse> response = activeOnly
            ? condolenceService.getActivePolicies()
            : condolenceService.getAllPolicies();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/policies/{id}")
    @Operation(summary = "경조비 정책 상세 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CondolencePolicyResponse>> getPolicyById(@PathVariable UUID id) {
        CondolencePolicyResponse response = condolenceService.getPolicyById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/policies")
    @Operation(summary = "경조비 정책 생성")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CondolencePolicyResponse>> createPolicy(
            @Valid @RequestBody CreateCondolencePolicyRequest request) {
        CondolencePolicyResponse response = condolenceService.createPolicy(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @PutMapping("/policies/{id}")
    @Operation(summary = "경조비 정책 수정")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CondolencePolicyResponse>> updatePolicy(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCondolencePolicyRequest request) {
        CondolencePolicyResponse response = condolenceService.updatePolicy(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/policies/{id}")
    @Operation(summary = "경조비 정책 삭제")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePolicy(@PathVariable UUID id) {
        condolenceService.deletePolicy(id);
        return ResponseEntity.ok(ApiResponse.success(null, "경조비 정책이 삭제되었습니다."));
    }
}
