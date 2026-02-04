package com.hrsaas.notification.controller;

import com.hrsaas.notification.domain.entity.NotificationTemplate;
import com.hrsaas.notification.service.NotificationTemplateService;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications/templates")
@RequiredArgsConstructor
@Tag(name = "Notification Templates", description = "알림 템플릿 관리 API")
public class NotificationTemplateController {

    private final NotificationTemplateService templateService;

    @GetMapping
    @Operation(summary = "템플릿 목록 조회", description = "알림 템플릿 목록을 조회합니다.")
    public ResponseEntity<ApiResponse<PageResponse<NotificationTemplate>>> getTemplates(Pageable pageable) {
        PageResponse<NotificationTemplate> templates = templateService.getTemplates(pageable);
        return ResponseEntity.ok(ApiResponse.success(templates));
    }

    @GetMapping("/{templateId}")
    @Operation(summary = "템플릿 상세 조회", description = "알림 템플릿 상세 정보를 조회합니다.")
    public ResponseEntity<ApiResponse<NotificationTemplate>> getTemplate(@PathVariable UUID templateId) {
        NotificationTemplate template = templateService.getTemplate(templateId);
        return ResponseEntity.ok(ApiResponse.success(template));
    }

    @PostMapping
    @Operation(summary = "템플릿 생성", description = "새 알림 템플릿을 생성합니다.")
    public ResponseEntity<ApiResponse<NotificationTemplate>> createTemplate(
            @Valid @RequestBody NotificationTemplate template) {
        NotificationTemplate created = templateService.createTemplate(template);
        return ResponseEntity.ok(ApiResponse.success(created, "템플릿이 생성되었습니다."));
    }

    @PutMapping("/{templateId}")
    @Operation(summary = "템플릿 수정", description = "알림 템플릿을 수정합니다.")
    public ResponseEntity<ApiResponse<NotificationTemplate>> updateTemplate(
            @PathVariable UUID templateId,
            @Valid @RequestBody NotificationTemplate template) {
        NotificationTemplate updated = templateService.updateTemplate(templateId, template);
        return ResponseEntity.ok(ApiResponse.success(updated, "템플릿이 수정되었습니다."));
    }

    @DeleteMapping("/{templateId}")
    @Operation(summary = "템플릿 삭제", description = "알림 템플릿을 삭제(비활성화)합니다.")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable UUID templateId) {
        templateService.deleteTemplate(templateId);
        return ResponseEntity.ok(ApiResponse.success(null, "템플릿이 삭제되었습니다."));
    }
}
