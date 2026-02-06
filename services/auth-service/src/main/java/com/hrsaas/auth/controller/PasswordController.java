package com.hrsaas.auth.controller;

import com.hrsaas.auth.domain.dto.request.ChangePasswordRequest;
import com.hrsaas.auth.domain.dto.request.ResetPasswordConfirmRequest;
import com.hrsaas.auth.domain.dto.request.ResetPasswordRequest;
import com.hrsaas.auth.service.PasswordService;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.security.SecurityContextHolder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth/password")
@RequiredArgsConstructor
@Tag(name = "Password Management", description = "비밀번호 관리 API")
public class PasswordController {

    private final PasswordService passwordService;

    @PostMapping("/change")
    @Operation(summary = "비밀번호 변경", description = "현재 비밀번호를 확인 후 새 비밀번호로 변경합니다.")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        String userId = SecurityContextHolder.getCurrentUserId().toString();
        passwordService.changePassword(userId, request);
        return ResponseEntity.ok(ApiResponse.success(null, "비밀번호가 성공적으로 변경되었습니다."));
    }

    @PostMapping("/reset")
    @Operation(summary = "비밀번호 초기화 요청", description = "이메일로 비밀번호 초기화 링크를 발송합니다.")
    public ResponseEntity<ApiResponse<Void>> requestPasswordReset(
            @Valid @RequestBody ResetPasswordRequest request) {
        passwordService.requestPasswordReset(request);
        return ResponseEntity.ok(ApiResponse.success(null, "비밀번호 초기화 이메일이 발송되었습니다."));
    }

    @PostMapping("/reset/confirm")
    @Operation(summary = "비밀번호 초기화 확인", description = "토큰을 확인하고 새 비밀번호를 설정합니다.")
    public ResponseEntity<ApiResponse<Void>> confirmPasswordReset(
            @Valid @RequestBody ResetPasswordConfirmRequest request) {
        passwordService.confirmPasswordReset(request);
        return ResponseEntity.ok(ApiResponse.success(null, "비밀번호가 성공적으로 초기화되었습니다."));
    }
}
