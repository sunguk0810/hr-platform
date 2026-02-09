package com.hrsaas.mdm.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.mdm.domain.dto.request.CreateCodeGroupRequest;
import com.hrsaas.mdm.domain.dto.request.UpdateCodeGroupRequest;
import com.hrsaas.mdm.domain.dto.response.CodeGroupResponse;
import com.hrsaas.mdm.service.CodeGroupService;
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
@RequestMapping("/api/v1/mdm/code-groups")
@RequiredArgsConstructor
@Tag(name = "Code Group", description = "코드 그룹 관리 API")
public class CodeGroupController {

    private final CodeGroupService codeGroupService;

    @PostMapping
    @Operation(summary = "코드 그룹 생성")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CodeGroupResponse>> create(
            @Valid @RequestBody CreateCodeGroupRequest request) {
        CodeGroupResponse response = codeGroupService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/{groupCode}")
    @Operation(summary = "코드 그룹 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CodeGroupResponse>> getByGroupCode(
            @PathVariable String groupCode) {
        CodeGroupResponse response = codeGroupService.getByGroupCode(groupCode);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "코드 그룹 목록 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<CodeGroupResponse>>> getAll() {
        List<CodeGroupResponse> response = codeGroupService.getAll();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "코드 그룹 수정")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CodeGroupResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCodeGroupRequest request) {
        CodeGroupResponse response = codeGroupService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "코드 그룹 삭제")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        codeGroupService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "코드 그룹이 삭제되었습니다."));
    }
}
