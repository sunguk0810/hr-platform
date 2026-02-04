package com.hrsaas.certificate.controller;

import com.hrsaas.certificate.domain.dto.request.CreateCertificateTemplateRequest;
import com.hrsaas.certificate.domain.dto.request.UpdateCertificateTemplateRequest;
import com.hrsaas.certificate.domain.dto.response.CertificateTemplateResponse;
import com.hrsaas.certificate.service.CertificateTemplateService;
import com.hrsaas.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * 증명서 템플릿 컨트롤러
 */
@Tag(name = "Certificate Template", description = "증명서 템플릿 관리 API")
@RestController
@RequestMapping("/api/v1/certificates/templates")
@RequiredArgsConstructor
public class CertificateTemplateController {

    private final CertificateTemplateService certificateTemplateService;

    @Operation(summary = "템플릿 생성")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<CertificateTemplateResponse> create(@Valid @RequestBody CreateCertificateTemplateRequest request) {
        return ApiResponse.success(certificateTemplateService.create(request));
    }

    @Operation(summary = "템플릿 상세 조회")
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<CertificateTemplateResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(certificateTemplateService.getById(id));
    }

    @Operation(summary = "이름으로 템플릿 조회")
    @GetMapping("/name/{name}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<CertificateTemplateResponse> getByName(@PathVariable String name) {
        return ApiResponse.success(certificateTemplateService.getByName(name));
    }

    @Operation(summary = "전체 템플릿 목록 조회")
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<CertificateTemplateResponse>> getAll() {
        return ApiResponse.success(certificateTemplateService.getAll());
    }

    @Operation(summary = "활성화된 템플릿 목록 조회")
    @GetMapping("/active")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<CertificateTemplateResponse>> getActiveTemplates() {
        return ApiResponse.success(certificateTemplateService.getActiveTemplates());
    }

    @Operation(summary = "템플릿 수정")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<CertificateTemplateResponse> update(@PathVariable UUID id,
                                                            @Valid @RequestBody UpdateCertificateTemplateRequest request) {
        return ApiResponse.success(certificateTemplateService.update(id, request));
    }

    @Operation(summary = "템플릿 삭제")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public void delete(@PathVariable UUID id) {
        certificateTemplateService.delete(id);
    }

    @Operation(summary = "템플릿 활성화")
    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Void> activate(@PathVariable UUID id) {
        certificateTemplateService.activate(id);
        return ApiResponse.success(null);
    }

    @Operation(summary = "템플릿 비활성화")
    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Void> deactivate(@PathVariable UUID id) {
        certificateTemplateService.deactivate(id);
        return ApiResponse.success(null);
    }

    @Operation(summary = "템플릿 검색")
    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<CertificateTemplateResponse>> search(@RequestParam String keyword) {
        return ApiResponse.success(certificateTemplateService.search(keyword));
    }

    @Operation(summary = "템플릿 미리보기 HTML")
    @GetMapping(value = "/{id}/preview", produces = MediaType.TEXT_HTML_VALUE)
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public String generatePreviewHtml(@PathVariable UUID id) {
        return certificateTemplateService.generatePreviewHtml(id);
    }
}
