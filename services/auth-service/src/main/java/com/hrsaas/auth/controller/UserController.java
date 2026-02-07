package com.hrsaas.auth.controller;

import com.hrsaas.auth.domain.dto.request.CreateUserRequest;
import com.hrsaas.auth.domain.dto.request.UpdateUserRolesRequest;
import com.hrsaas.auth.domain.dto.request.UpdateUserStatusRequest;
import com.hrsaas.auth.domain.dto.response.UserDetailResponse;
import com.hrsaas.auth.service.UserManagementService;
import com.hrsaas.common.response.ApiResponse;
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
@RequestMapping("/api/v1/auth/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "사용자 관리 API")
public class UserController {

    private final UserManagementService userManagementService;

    @PostMapping
    @Operation(summary = "사용자 생성", description = "새로운 사용자 계정을 생성합니다.")
    public ResponseEntity<ApiResponse<UserDetailResponse>> createUser(
            @Valid @RequestBody CreateUserRequest request) {
        UserDetailResponse response = userManagementService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "사용자 목록 조회", description = "전체 사용자 목록을 조회합니다.")
    public ResponseEntity<ApiResponse<List<UserDetailResponse>>> getUsers() {
        List<UserDetailResponse> response = userManagementService.getUsers();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{userId}")
    @Operation(summary = "사용자 상세 조회", description = "특정 사용자의 상세 정보를 조회합니다.")
    public ResponseEntity<ApiResponse<UserDetailResponse>> getUser(
            @PathVariable UUID userId) {
        UserDetailResponse response = userManagementService.getUser(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{userId}/status")
    @Operation(summary = "사용자 상태 변경", description = "사용자의 활성/비활성 상태를 변경합니다.")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        userManagementService.updateStatus(userId, request);
        return ResponseEntity.ok(ApiResponse.success(null, "사용자 상태가 변경되었습니다."));
    }

    @PutMapping("/{userId}/roles")
    @Operation(summary = "사용자 역할 변경", description = "사용자의 역할을 변경합니다.")
    public ResponseEntity<ApiResponse<Void>> updateRoles(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserRolesRequest request) {
        userManagementService.updateRoles(userId, request);
        return ResponseEntity.ok(ApiResponse.success(null, "사용자 역할이 변경되었습니다."));
    }

    @PostMapping("/{userId}/unlock")
    @Operation(summary = "계정 잠금 해제", description = "잠긴 사용자 계정을 해제합니다.")
    public ResponseEntity<ApiResponse<Void>> unlockUser(
            @PathVariable UUID userId) {
        userManagementService.unlockUser(userId);
        return ResponseEntity.ok(ApiResponse.success(null, "계정 잠금이 해제되었습니다."));
    }

    @PostMapping("/{userId}/reset-password")
    @Operation(summary = "비밀번호 초기화", description = "관리자가 사용자의 비밀번호를 초기화합니다.")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @PathVariable UUID userId) {
        userManagementService.resetUserPassword(userId);
        return ResponseEntity.ok(ApiResponse.success(null, "비밀번호가 초기화되었습니다."));
    }
}
