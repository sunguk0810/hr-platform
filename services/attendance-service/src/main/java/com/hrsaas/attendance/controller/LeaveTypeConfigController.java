package com.hrsaas.attendance.controller;

import com.hrsaas.attendance.domain.entity.LeaveTypeConfig;
import com.hrsaas.attendance.service.LeaveTypeConfigService;
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
@RequestMapping("/api/v1/leaves/type-configs")
@RequiredArgsConstructor
@Tag(name = "LeaveTypeConfig", description = "휴가 유형 설정 관리 API")
public class LeaveTypeConfigController {

    private final LeaveTypeConfigService configService;

    @GetMapping
    @Operation(summary = "활성 휴가 유형 설정 목록")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<LeaveTypeConfig>>> getActiveConfigs() {
        return ResponseEntity.ok(ApiResponse.success(configService.getActiveConfigs()));
    }

    @GetMapping("/all")
    @Operation(summary = "전체 휴가 유형 설정 목록 (관리자)")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<LeaveTypeConfig>>> getAllConfigs() {
        return ResponseEntity.ok(ApiResponse.success(configService.getAllConfigs()));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "코드로 휴가 유형 설정 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<LeaveTypeConfig>> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(ApiResponse.success(configService.getByCode(code)));
    }

    @PostMapping
    @Operation(summary = "휴가 유형 설정 생성")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<LeaveTypeConfig>> create(@RequestBody LeaveTypeConfig config) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(configService.create(config)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "휴가 유형 설정 수정")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<LeaveTypeConfig>> update(@PathVariable UUID id, @RequestBody LeaveTypeConfig config) {
        return ResponseEntity.ok(ApiResponse.success(configService.update(id, config)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "휴가 유형 설정 삭제")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        configService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "휴가 유형 설정이 삭제되었습니다."));
    }
}
