package com.hrsaas.file.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/v1/settings/file-upload-policy")
@Tag(name = "File Upload Policy", description = "파일 업로드 정책 설정 API")
public class FileUploadPolicyController {

    private final Map<UUID, Map<String, Object>> policyByTenant = new ConcurrentHashMap<>();

    @GetMapping
    @Operation(summary = "파일 업로드 정책 조회")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPolicy() {
        UUID tenantId = TenantContext.getCurrentTenant();
        Map<String, Object> policy = policyByTenant.computeIfAbsent(tenantId, key -> defaultPolicy());
        return ResponseEntity.ok(ApiResponse.success(policy));
    }

    @PutMapping
    @Operation(summary = "파일 업로드 정책 저장")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> savePolicy(@RequestBody Map<String, Object> request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        policyByTenant.put(tenantId, request);
        return ResponseEntity.ok(ApiResponse.success(request));
    }

    private Map<String, Object> defaultPolicy() {
        return Map.of(
            "defaultPolicy", Map.of(
                "maxFileSizeMB", 10,
                "maxTotalStorageGB", 5,
                "allowedExtensions", List.of(".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".hwp",
                    ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".zip", ".txt", ".csv")
            ),
            "categoryOverrides", List.of()
        );
    }
}
