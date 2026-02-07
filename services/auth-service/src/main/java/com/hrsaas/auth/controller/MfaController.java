package com.hrsaas.auth.controller;

import com.hrsaas.auth.domain.dto.response.TokenResponse;
import com.hrsaas.auth.service.MfaService;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.security.SecurityContextHolder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth/mfa")
@RequiredArgsConstructor
@Tag(name = "MFA", description = "다중 인증(MFA) API")
public class MfaController {

    private final MfaService mfaService;

    @PostMapping("/setup")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "MFA 설정 시작", description = "TOTP MFA 설정을 시작합니다.")
    public ResponseEntity<ApiResponse<MfaService.MfaSetupResponse>> setupMfa() {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        MfaService.MfaSetupResponse response = mfaService.setupMfa(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/verify-setup")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "MFA 설정 확인", description = "TOTP 코드를 검증하여 MFA를 활성화합니다.")
    public ResponseEntity<ApiResponse<List<String>>> verifySetup(
            @RequestBody Map<String, String> body) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        List<String> recoveryCodes = mfaService.verifySetup(userId, body.get("code"));
        return ResponseEntity.ok(ApiResponse.success(recoveryCodes, "MFA가 활성화되었습니다. 복구 코드를 안전한 곳에 보관하세요."));
    }

    @PostMapping("/verify")
    @Operation(summary = "MFA 로그인 검증", description = "로그인 시 TOTP 코드를 검증합니다.")
    public ResponseEntity<ApiResponse<TokenResponse>> verifyLogin(
            @RequestBody Map<String, String> body,
            HttpServletRequest httpRequest) {
        String mfaToken = body.get("mfaToken");
        String code = body.get("code");
        String ipAddress = extractIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        TokenResponse response = mfaService.verifyLogin(mfaToken, code, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/disable")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "MFA 비활성화", description = "MFA를 비활성화합니다.")
    public ResponseEntity<ApiResponse<Void>> disableMfa(
            @RequestBody Map<String, String> body) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        mfaService.disableMfa(userId, body.get("code"));
        return ResponseEntity.ok(ApiResponse.success(null, "MFA가 비활성화되었습니다."));
    }

    @GetMapping("/status")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "MFA 상태 조회", description = "MFA 활성화 상태를 조회합니다.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus() {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        boolean enabled = mfaService.isMfaEnabled(userId);
        int recoveryCodes = enabled ? mfaService.getRecoveryCodesCount(userId) : 0;
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "mfaEnabled", enabled,
                "recoveryCodesRemaining", recoveryCodes
        )));
    }

    private String extractIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}
