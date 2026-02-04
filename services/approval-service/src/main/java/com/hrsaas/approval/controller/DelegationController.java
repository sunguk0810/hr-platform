package com.hrsaas.approval.controller;

import com.hrsaas.approval.domain.dto.request.CreateDelegationRuleRequest;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
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
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateDelegationRuleRequest request) {
        UUID delegatorId = UUID.fromString(jwt.getSubject());
        String delegatorName = jwt.getClaimAsString("name");

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
    public ResponseEntity<ApiResponse<List<DelegationRuleResponse>>> getMyDelegations(
            @AuthenticationPrincipal Jwt jwt) {
        UUID delegatorId = UUID.fromString(jwt.getSubject());
        List<DelegationRuleResponse> response = delegationService.getByDelegatorId(delegatorId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my/effective")
    @Operation(summary = "내 현재 유효한 대결 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DelegationRuleResponse>> getMyEffectiveDelegation(
            @AuthenticationPrincipal Jwt jwt) {
        UUID delegatorId = UUID.fromString(jwt.getSubject());
        return delegationService.getEffectiveRule(delegatorId)
            .map(r -> ResponseEntity.ok(ApiResponse.success(r)))
            .orElse(ResponseEntity.ok(ApiResponse.success(null, "현재 유효한 대결 설정이 없습니다.")));
    }

    @GetMapping("/delegated-to-me")
    @Operation(summary = "내가 대리 결재하는 목록 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<DelegationRuleResponse>>> getDelegatedToMe(
            @AuthenticationPrincipal Jwt jwt) {
        UUID delegateId = UUID.fromString(jwt.getSubject());
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
}
