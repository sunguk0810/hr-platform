package com.hrsaas.approval.controller;

import com.hrsaas.approval.domain.dto.request.CreateDelegationRuleRequest;
import com.hrsaas.approval.domain.dto.request.UpdateDelegationRuleRequest;
import com.hrsaas.approval.domain.dto.response.DelegationRuleResponse;
import com.hrsaas.approval.service.DelegationService;
import com.hrsaas.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.security.UserContext;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/approvals/delegations")
@RequiredArgsConstructor
@Tag(name = "Delegation", description = "대결(위임) 설정 API")
public class DelegationController {

    private final DelegationService delegationService;

    @PostMapping
    @Operation(summary = "대결 설정")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DelegationRuleResponse>> create(
            @Valid @RequestBody CreateDelegationRuleRequest request) {
        UserContext context = SecurityContextHolder.getCurrentUser();
        UUID delegatorId = context.getUserId();
        String delegatorName = context.getUsername();

        DelegationRuleResponse response = delegationService.create(delegatorId, delegatorName, request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "대결 설정 상세 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DelegationRuleResponse>> getById(@PathVariable UUID id) {
        DelegationRuleResponse response = delegationService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my")
    @Operation(summary = "내 대결 설정 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<DelegationRuleResponse>>> getMyDelegations() {
        UserContext context = SecurityContextHolder.getCurrentUser();
        UUID delegatorId = context.getUserId();
        List<DelegationRuleResponse> response = delegationService.getByDelegatorId(delegatorId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my/effective")
    @Operation(summary = "내 현재 유효한 대결 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DelegationRuleResponse>> getMyEffectiveDelegation() {
        UserContext context = SecurityContextHolder.getCurrentUser();
        UUID delegatorId = context.getUserId();
        return delegationService.getEffectiveRule(delegatorId)
            .map(r -> ResponseEntity.ok(ApiResponse.success(r)))
            .orElse(ResponseEntity.ok(ApiResponse.success(null, "현재 유효한 대결 설정이 없습니다.")));
    }

    @GetMapping("/delegated-to-me")
    @Operation(summary = "내가 대리 결재하는 목록 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<DelegationRuleResponse>>> getDelegatedToMe() {
        UserContext context = SecurityContextHolder.getCurrentUser();
        UUID delegateId = context.getUserId();
        List<DelegationRuleResponse> response = delegationService.getByDelegateId(delegateId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "전체 대결 설정 목록 조회 (관리자용)")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<DelegationRuleResponse>>> getAll() {
        List<DelegationRuleResponse> response = delegationService.getAll();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "대결 설정 수정")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DelegationRuleResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDelegationRuleRequest request) {
        DelegationRuleResponse response = delegationService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "대결 취소 (비활성화)")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> cancel(@PathVariable UUID id) {
        delegationService.cancel(id);
        return ResponseEntity.ok(ApiResponse.success(null, "대결 설정이 취소되었습니다."));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "대결 설정 삭제")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        delegationService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "대결 설정이 삭제되었습니다."));
    }

    @PostMapping("/{id}/toggle-status")
    @Operation(summary = "위임 규칙 활성화 상태 토글")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DelegationRuleResponse>> toggleStatus(@PathVariable UUID id) {
        DelegationRuleResponse response = delegationService.toggleStatus(id);
        String message = response.getIsActive() ? "위임 규칙이 활성화되었습니다." : "위임 규칙이 비활성화되었습니다.";
        return ResponseEntity.ok(ApiResponse.success(response, message));
    }
}
