package com.hrsaas.approval.controller;

import com.hrsaas.approval.domain.entity.ArbitraryApprovalRule;
import com.hrsaas.approval.service.ArbitraryApprovalRuleService;
import com.hrsaas.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/approvals/arbitrary-rules")
@RequiredArgsConstructor
@Tag(name = "ArbitraryApprovalRule", description = "전결 규칙 관리 API")
public class ArbitraryApprovalRuleController {

    private final ArbitraryApprovalRuleService ruleService;

    @PostMapping
    @Operation(summary = "전결 규칙 생성")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ArbitraryApprovalRule>> create(@RequestBody ArbitraryApprovalRule rule) {
        ArbitraryApprovalRule created = ruleService.create(rule);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(created));
    }

    @GetMapping
    @Operation(summary = "전결 규칙 목록 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<ArbitraryApprovalRule>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(ruleService.getAll()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "전결 규칙 상세 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ArbitraryApprovalRule>> getById(@PathVariable UUID id) {
        return ruleService.getById(id)
            .map(rule -> ResponseEntity.ok(ApiResponse.success(rule)))
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @Operation(summary = "전결 규칙 수정")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ArbitraryApprovalRule>> update(@PathVariable UUID id, @RequestBody ArbitraryApprovalRule rule) {
        ArbitraryApprovalRule updated = ruleService.update(id, rule);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "전결 규칙 삭제")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        ruleService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "전결 규칙이 삭제되었습니다."));
    }
}
