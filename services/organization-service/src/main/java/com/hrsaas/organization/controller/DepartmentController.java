package com.hrsaas.organization.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.organization.domain.dto.request.CreateDepartmentRequest;
import com.hrsaas.organization.domain.dto.request.UpdateDepartmentRequest;
import com.hrsaas.organization.domain.dto.response.DepartmentResponse;
import com.hrsaas.organization.domain.dto.response.DepartmentTreeResponse;
import com.hrsaas.organization.service.DepartmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
@Tag(name = "Department", description = "부서 관리 API")
public class DepartmentController {

    private final DepartmentService departmentService;

    @PostMapping
    @Operation(summary = "부서 생성")
    public ResponseEntity<ApiResponse<DepartmentResponse>> create(
            @Valid @RequestBody CreateDepartmentRequest request) {
        DepartmentResponse response = departmentService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "부서 상세 조회")
    public ResponseEntity<ApiResponse<DepartmentResponse>> getById(@PathVariable UUID id) {
        DepartmentResponse response = departmentService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "부서 목록 조회")
    public ResponseEntity<ApiResponse<List<DepartmentResponse>>> getAll() {
        List<DepartmentResponse> response = departmentService.getAll();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/tree")
    @Operation(summary = "조직도 트리 조회")
    public ResponseEntity<ApiResponse<List<DepartmentTreeResponse>>> getTree() {
        List<DepartmentTreeResponse> response = departmentService.getTree();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "부서 수정")
    public ResponseEntity<ApiResponse<DepartmentResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDepartmentRequest request) {
        DepartmentResponse response = departmentService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "부서 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        departmentService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "부서가 삭제되었습니다."));
    }
}
