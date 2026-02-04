package com.hrsaas.approval.controller;

import com.hrsaas.approval.domain.dto.request.CreateApprovalTemplateRequest;
import com.hrsaas.approval.domain.dto.request.UpdateApprovalTemplateRequest;
import com.hrsaas.approval.domain.dto.response.ApprovalTemplateResponse;
import com.hrsaas.approval.service.ApprovalTemplateService;
import com.hrsaas.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/approvals/templates")
@RequiredArgsConstructor
@Tag(name = "Approval Template", description = "결재 템플릿 관리 API")
public class ApprovalTemplateController {

    private final ApprovalTemplateService approvalTemplateService;

    @PostMapping
    @Operation(summary = "결재 템플릿 생성")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ApprovalTemplateResponse>> create(
            @Valid @RequestBody CreateApprovalTemplateRequest request) {
        ApprovalTemplateResponse response = approvalTemplateService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "결재 템플릿 상세 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ApprovalTemplateResponse>> getById(@PathVariable UUID id) {
        ApprovalTemplateResponse response = approvalTemplateService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "결재 템플릿 코드로 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ApprovalTemplateResponse>> getByCode(@PathVariable String code) {
        ApprovalTemplateResponse response = approvalTemplateService.getByCode(code);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "결재 템플릿 목록 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ApprovalTemplateResponse>>> getAll(
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly,
            @RequestParam(required = false) String documentType) {

        List<ApprovalTemplateResponse> response;

        if (documentType != null) {
            response = approvalTemplateService.getByDocumentType(documentType);
        } else if (activeOnly) {
            response = approvalTemplateService.getActive();
        } else {
            response = approvalTemplateService.getAll();
        }

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "결재 템플릿 수정")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ApprovalTemplateResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateApprovalTemplateRequest request) {
        ApprovalTemplateResponse response = approvalTemplateService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "결재 템플릿 삭제 (비활성화)")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        approvalTemplateService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "결재 템플릿이 삭제되었습니다."));
    }
}
