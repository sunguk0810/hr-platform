package com.hrsaas.mdm.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.mdm.domain.dto.request.CreateCodeUsageMappingRequest;
import com.hrsaas.mdm.domain.dto.response.CodeUsageMappingResponse;
import com.hrsaas.mdm.domain.entity.CodeUsageMapping;
import com.hrsaas.mdm.repository.CodeUsageMappingRepository;
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

/**
 * 코드 사용처 매핑 관리 API (SUPER_ADMIN 전용)
 */
@RestController
@RequestMapping("/api/v1/admin/mdm/code-usages")
@RequiredArgsConstructor
@Tag(name = "Code Usage Mapping", description = "코드 사용처 매핑 관리 API")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class CodeUsageMappingController {

    private final CodeUsageMappingRepository codeUsageMappingRepository;

    @GetMapping
    @Operation(summary = "전체 코드 사용처 매핑 조회")
    public ResponseEntity<ApiResponse<List<CodeUsageMappingResponse>>> getAll() {
        List<CodeUsageMappingResponse> response = codeUsageMappingRepository.findAll().stream()
            .map(CodeUsageMappingResponse::from)
            .toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/group/{groupCode}")
    @Operation(summary = "그룹별 코드 사용처 매핑 조회")
    public ResponseEntity<ApiResponse<List<CodeUsageMappingResponse>>> getByGroupCode(
            @PathVariable String groupCode) {
        List<CodeUsageMappingResponse> response = codeUsageMappingRepository.findByGroupCode(groupCode).stream()
            .map(CodeUsageMappingResponse::from)
            .toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "코드 사용처 매핑 생성")
    public ResponseEntity<ApiResponse<CodeUsageMappingResponse>> create(
            @Valid @RequestBody CreateCodeUsageMappingRequest request) {
        CodeUsageMapping mapping = CodeUsageMapping.builder()
            .groupCode(request.getGroupCode())
            .resourceType(request.getResourceType())
            .resourceName(request.getResourceName())
            .description(request.getDescription())
            .estimatedImpact(request.getEstimatedImpact() != null ? request.getEstimatedImpact() : "MEDIUM")
            .build();

        CodeUsageMapping saved = codeUsageMappingRepository.save(mapping);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(CodeUsageMappingResponse.from(saved)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "코드 사용처 매핑 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        codeUsageMappingRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "코드 사용처 매핑이 삭제되었습니다."));
    }
}
