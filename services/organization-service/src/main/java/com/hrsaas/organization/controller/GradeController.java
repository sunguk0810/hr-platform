package com.hrsaas.organization.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.organization.domain.dto.request.CreateGradeRequest;
import com.hrsaas.organization.domain.dto.request.UpdateGradeRequest;
import com.hrsaas.organization.domain.dto.response.GradeResponse;
import com.hrsaas.organization.service.GradeService;
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
@RequestMapping("/api/v1/grades")
@RequiredArgsConstructor
@Tag(name = "Grade", description = "직급 관리 API")
public class GradeController {

    private final GradeService gradeService;

    @PostMapping
    @Operation(summary = "직급 생성")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<GradeResponse>> create(
            @Valid @RequestBody CreateGradeRequest request) {
        GradeResponse response = gradeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "직급 상세 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<GradeResponse>> getById(@PathVariable UUID id) {
        GradeResponse response = gradeService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "직급 코드로 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<GradeResponse>> getByCode(@PathVariable String code) {
        GradeResponse response = gradeService.getByCode(code);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "직급 목록 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<GradeResponse>>> getAll(
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly) {
        List<GradeResponse> response = activeOnly ? gradeService.getActive() : gradeService.getAll();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "직급 수정")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<GradeResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateGradeRequest request) {
        GradeResponse response = gradeService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "직급 삭제 (비활성화)")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        gradeService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "직급이 삭제되었습니다."));
    }
}
