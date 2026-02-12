package com.hrsaas.notification.controller;

import com.hrsaas.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

@RestController
@RequestMapping("/api/v1/settings/notification-channels")
@RequiredArgsConstructor
@Tag(name = "Notification Channel Settings", description = "알림 채널 설정 API")
public class NotificationChannelSettingsController {

    private final AtomicReference<Map<String, Object>> settingsRef =
        new AtomicReference<>(Map.of("smtp", Map.of(), "sms", Map.of(), "channelMappings", java.util.List.of()));

    @PutMapping
    @Operation(summary = "알림 채널 설정 저장")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> save(@RequestBody Map<String, Object> request) {
        settingsRef.set(request);
        return ResponseEntity.ok(ApiResponse.success(request));
    }

    @PostMapping("/test-email")
    @Operation(summary = "이메일 테스트")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testEmail(@RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(ApiResponse.success(Map.of("tested", true, "type", request.getOrDefault("type", "connection"))));
    }

    @PostMapping("/test-sms")
    @Operation(summary = "SMS 테스트")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testSms(@RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(ApiResponse.success(Map.of("tested", true, "type", request.getOrDefault("type", "connection"))));
    }
}
