package com.hrsaas.employee.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.employee.domain.dto.request.CreateTransferRequest;
import com.hrsaas.employee.domain.dto.request.UpdateTransferRequest;
import com.hrsaas.employee.domain.dto.response.DepartmentSimpleResponse;
import com.hrsaas.employee.domain.dto.response.GradeSimpleResponse;
import com.hrsaas.employee.domain.dto.response.PositionSimpleResponse;
import com.hrsaas.employee.domain.dto.response.TenantSimpleResponse;
import com.hrsaas.employee.domain.dto.response.TransferRequestResponse;
import com.hrsaas.employee.service.TransferService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transfers")
@RequiredArgsConstructor
@Tag(name = "Transfer", description = "계열사 전출/전입 관리 API")
public class TransferController {

    private final TransferService transferService;

    @PostMapping
    @Operation(summary = "전출/전입 요청 생성")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TransferRequestResponse>> create(
            @Valid @RequestBody CreateTransferRequest request) {
        TransferRequestResponse response = transferService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "전출/전입 요청 상세 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TransferRequestResponse>> getById(@PathVariable UUID id) {
        TransferRequestResponse response = transferService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "전출/전입 요청 목록 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Page<TransferRequestResponse>>> getAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<TransferRequestResponse> response = transferService.getAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/summary")
    @Operation(summary = "전출/전입 요약 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TransferService.TransferSummary>> getSummary() {
        TransferService.TransferSummary summary = transferService.getSummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @PutMapping("/{id}")
    @Operation(summary = "전출/전입 요청 수정")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TransferRequestResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTransferRequest request) {
        TransferRequestResponse response = transferService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "전출/전입 요청 삭제 (임시저장 상태만)")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        transferService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "전출/전입 요청이 삭제되었습니다."));
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "전출/전입 요청 제출 (상신)")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TransferRequestResponse>> submit(@PathVariable UUID id) {
        TransferRequestResponse response = transferService.submit(id);
        return ResponseEntity.ok(ApiResponse.success(response, "전출/전입 요청이 제출되었습니다."));
    }

    @PostMapping("/{id}/approve-source")
    @Operation(summary = "전출 승인 (전출 테넌트)")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TransferRequestResponse>> approveSource(@PathVariable UUID id) {
        var currentUser = SecurityContextHolder.getCurrentUser();
        UUID approverId = currentUser != null ? currentUser.getUserId() : null;
        String approverName = currentUser != null ? currentUser.getUsername() : null;

        TransferRequestResponse response = transferService.approveSource(id, approverId, approverName);
        return ResponseEntity.ok(ApiResponse.success(response, "전출이 승인되었습니다."));
    }

    @PostMapping("/{id}/approve-target")
    @Operation(summary = "전입 승인 (전입 테넌트)")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TransferRequestResponse>> approveTarget(@PathVariable UUID id) {
        var currentUser = SecurityContextHolder.getCurrentUser();
        UUID approverId = currentUser != null ? currentUser.getUserId() : null;
        String approverName = currentUser != null ? currentUser.getUsername() : null;

        TransferRequestResponse response = transferService.approveTarget(id, approverId, approverName);
        return ResponseEntity.ok(ApiResponse.success(response, "전입이 승인되었습니다."));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "전출/전입 거부")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TransferRequestResponse>> reject(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String reason = body.get("reason");
        TransferRequestResponse response = transferService.reject(id, reason);
        return ResponseEntity.ok(ApiResponse.success(response, "전출/전입이 거부되었습니다."));
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "전출/전입 완료 처리")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TransferRequestResponse>> complete(@PathVariable UUID id) {
        TransferRequestResponse response = transferService.complete(id);
        return ResponseEntity.ok(ApiResponse.success(response, "전출/전입이 완료되었습니다."));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "전출/전입 취소")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TransferRequestResponse>> cancel(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String reason = body.get("reason");
        TransferRequestResponse response = transferService.cancel(id, reason);
        return ResponseEntity.ok(ApiResponse.success(response, "전출/전입이 취소되었습니다."));
    }

    @GetMapping("/available-tenants")
    @Operation(summary = "전출 가능한 테넌트 목록 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<TenantSimpleResponse>>> getAvailableTenants() {
        List<TenantSimpleResponse> response = transferService.getAvailableTenants();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/tenants/{tenantId}/departments")
    @Operation(summary = "특정 테넌트의 부서 목록 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<DepartmentSimpleResponse>>> getTenantDepartments(
            @PathVariable String tenantId) {
        List<DepartmentSimpleResponse> response = transferService.getTenantDepartments(tenantId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/tenants/{tenantId}/positions")
    @Operation(summary = "특정 테넌트의 직위 목록 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<PositionSimpleResponse>>> getTenantPositions(
            @PathVariable String tenantId) {
        List<PositionSimpleResponse> response = transferService.getTenantPositions(tenantId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/tenants/{tenantId}/grades")
    @Operation(summary = "특정 테넌트의 직급 목록 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<GradeSimpleResponse>>> getTenantGrades(
            @PathVariable String tenantId) {
        List<GradeSimpleResponse> response = transferService.getTenantGrades(tenantId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
