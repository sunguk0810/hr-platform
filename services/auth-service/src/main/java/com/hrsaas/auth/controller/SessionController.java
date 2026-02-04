package com.hrsaas.auth.controller;

import com.hrsaas.auth.domain.dto.response.SessionResponse;
import com.hrsaas.auth.service.SessionService;
import com.hrsaas.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth/sessions")
@RequiredArgsConstructor
@Tag(name = "Session Management", description = "세션 관리 API")
public class SessionController {

    private final SessionService sessionService;

    @GetMapping
    @Operation(summary = "활성 세션 목록", description = "현재 사용자의 모든 활성 세션을 조회합니다.")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> getActiveSessions(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("Authorization") String authorization) {
        String sessionToken = extractToken(authorization);
        List<SessionResponse> sessions = sessionService.getActiveSessions(userId, sessionToken);
        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    @DeleteMapping("/{sessionId}")
    @Operation(summary = "특정 세션 종료", description = "지정된 세션을 종료합니다.")
    public ResponseEntity<ApiResponse<Void>> terminateSession(
            @RequestHeader("X-User-ID") String userId,
            @PathVariable UUID sessionId) {
        sessionService.terminateSession(userId, sessionId);
        return ResponseEntity.ok(ApiResponse.success(null, "세션이 종료되었습니다."));
    }

    @DeleteMapping
    @Operation(summary = "전체 세션 종료", description = "현재 사용자의 모든 세션을 종료합니다.")
    public ResponseEntity<ApiResponse<Void>> terminateAllSessions(
            @RequestHeader("X-User-ID") String userId) {
        sessionService.terminateAllSessions(userId);
        return ResponseEntity.ok(ApiResponse.success(null, "모든 세션이 종료되었습니다."));
    }

    @DeleteMapping("/others")
    @Operation(summary = "다른 세션 종료", description = "현재 세션을 제외한 모든 세션을 종료합니다.")
    public ResponseEntity<ApiResponse<Void>> terminateOtherSessions(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("Authorization") String authorization) {
        String sessionToken = extractToken(authorization);
        sessionService.terminateOtherSessions(userId, sessionToken);
        return ResponseEntity.ok(ApiResponse.success(null, "다른 세션들이 종료되었습니다."));
    }

    private String extractToken(String authorization) {
        if (authorization != null && authorization.startsWith("Bearer ")) {
            return authorization.substring(7);
        }
        return authorization;
    }
}
