package com.hrsaas.mdm.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.mdm.domain.dto.request.CodeSearchRequest;
import com.hrsaas.mdm.domain.dto.request.CreateCommonCodeRequest;
import com.hrsaas.mdm.domain.dto.request.UpdateCommonCodeRequest;
import com.hrsaas.mdm.domain.dto.response.CodeHistoryResponse;
import com.hrsaas.mdm.domain.dto.response.CodeImpactResponse;
import com.hrsaas.mdm.domain.dto.response.CodeTreeResponse;
import com.hrsaas.mdm.domain.dto.response.CommonCodeResponse;
import com.hrsaas.mdm.domain.dto.response.SimilarCodeResponse;
import com.hrsaas.mdm.service.CodeHistoryService;
import com.hrsaas.mdm.service.CodeImpactAnalyzer;
import com.hrsaas.mdm.service.CodeSearchService;
import com.hrsaas.mdm.service.CommonCodeService;
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
@RequestMapping("/api/v1/mdm/common-codes")
@RequiredArgsConstructor
@Tag(name = "Common Code", description = "공통 코드 관리 API")
public class CommonCodeController {

    private final CommonCodeService commonCodeService;
    private final CodeHistoryService codeHistoryService;
    private final CodeSearchService codeSearchService;
    private final CodeImpactAnalyzer codeImpactAnalyzer;

    @PostMapping
    @Operation(summary = "공통 코드 생성")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CommonCodeResponse>> create(
            @Valid @RequestBody CreateCommonCodeRequest request) {
        CommonCodeResponse response = commonCodeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "공통 코드 상세 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CommonCodeResponse>> getById(@PathVariable UUID id) {
        CommonCodeResponse response = commonCodeService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/group/{groupCode}")
    @Operation(summary = "그룹별 공통 코드 목록 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<CommonCodeResponse>>> getByGroupCode(
            @PathVariable String groupCode) {
        List<CommonCodeResponse> response = commonCodeService.getByGroupCode(groupCode);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/group/{groupCode}/code/{code}")
    @Operation(summary = "특정 공통 코드 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CommonCodeResponse>> getByGroupAndCode(
            @PathVariable String groupCode,
            @PathVariable String code) {
        CommonCodeResponse response = commonCodeService.getByGroupAndCode(groupCode, code);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/tree")
    @Operation(summary = "계층형 코드 트리 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<CodeTreeResponse>>> getCodeTree(
            @RequestParam String groupCode) {
        List<CodeTreeResponse> response = commonCodeService.getCodeTree(groupCode);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "공통 코드 수정")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CommonCodeResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCommonCodeRequest request) {
        CommonCodeResponse response = commonCodeService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}/activate")
    @Operation(summary = "공통 코드 활성화")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CommonCodeResponse>> activate(@PathVariable UUID id) {
        CommonCodeResponse response = commonCodeService.activate(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}/deactivate")
    @Operation(summary = "공통 코드 비활성화")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CommonCodeResponse>> deactivate(@PathVariable UUID id) {
        CommonCodeResponse response = commonCodeService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}/deprecate")
    @Operation(summary = "공통 코드 폐기")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CommonCodeResponse>> deprecate(@PathVariable UUID id) {
        CommonCodeResponse response = commonCodeService.deprecate(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "공통 코드 삭제")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        commonCodeService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "공통 코드가 삭제되었습니다."));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "공통 코드 변경 이력 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<CodeHistoryResponse>>> getHistory(@PathVariable UUID id) {
        List<CodeHistoryResponse> response = codeHistoryService.getByCodeId(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/history/group/{groupCode}")
    @Operation(summary = "그룹별 변경 이력 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<CodeHistoryResponse>>> getHistoryByGroupCode(
            @PathVariable String groupCode) {
        List<CodeHistoryResponse> response = codeHistoryService.getByGroupCode(groupCode);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/search")
    @Operation(summary = "유사 코드 검색")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<SimilarCodeResponse>>> searchSimilar(
            @RequestParam String keyword,
            @RequestParam(required = false) String groupCode,
            @RequestParam(required = false, defaultValue = "0.6") Double threshold,
            @RequestParam(required = false, defaultValue = "20") Integer maxResults,
            @RequestParam(required = false, defaultValue = "true") Boolean activeOnly) {

        CodeSearchRequest request = CodeSearchRequest.builder()
            .keyword(keyword)
            .groupCode(groupCode)
            .similarityThreshold(threshold)
            .maxResults(maxResults)
            .activeOnly(activeOnly)
            .build();

        List<SimilarCodeResponse> response = codeSearchService.searchSimilar(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/check-duplicate")
    @Operation(summary = "중복 코드 검사")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<SimilarCodeResponse>>> checkDuplicate(
            @RequestParam String groupCode,
            @RequestParam String codeName) {
        List<SimilarCodeResponse> response = codeSearchService.checkDuplicate(groupCode, codeName);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/impact")
    @Operation(summary = "코드 변경 영향도 분석")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CodeImpactResponse>> analyzeImpact(@PathVariable UUID id) {
        CodeImpactResponse response = codeImpactAnalyzer.analyzeImpact(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/impact/delete")
    @Operation(summary = "코드 삭제 영향도 분석")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CodeImpactResponse>> analyzeDeletionImpact(@PathVariable UUID id) {
        CodeImpactResponse response = codeImpactAnalyzer.analyzeDeletionImpact(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/impact/deprecate")
    @Operation(summary = "코드 폐기 영향도 분석")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CodeImpactResponse>> analyzeDeprecationImpact(@PathVariable UUID id) {
        CodeImpactResponse response = codeImpactAnalyzer.analyzeDeprecationImpact(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
