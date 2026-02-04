package com.hrsaas.certificate.controller;

import com.hrsaas.certificate.domain.dto.request.CreateCertificateTypeRequest;
import com.hrsaas.certificate.domain.dto.request.UpdateCertificateTypeRequest;
import com.hrsaas.certificate.domain.dto.response.CertificateTypeResponse;
import com.hrsaas.certificate.service.CertificateTypeService;
import com.hrsaas.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * 증명서 유형 컨트롤러
 */
@Tag(name = "Certificate Type", description = "증명서 유형 관리 API")
@RestController
@RequestMapping("/api/v1/certificates/types")
@RequiredArgsConstructor
public class CertificateTypeController {

    private final CertificateTypeService certificateTypeService;

    @Operation(summary = "증명서 유형 생성")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<CertificateTypeResponse> create(@Valid @RequestBody CreateCertificateTypeRequest request) {
        return ApiResponse.success(certificateTypeService.create(request));
    }

    @Operation(summary = "증명서 유형 상세 조회")
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<CertificateTypeResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(certificateTypeService.getById(id));
    }

    @Operation(summary = "코드로 증명서 유형 조회")
    @GetMapping("/code/{code}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<CertificateTypeResponse> getByCode(@PathVariable String code) {
        return ApiResponse.success(certificateTypeService.getByCode(code));
    }

    @Operation(summary = "전체 증명서 유형 목록 조회")
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<CertificateTypeResponse>> getAll() {
        return ApiResponse.success(certificateTypeService.getAll());
    }

    @Operation(summary = "활성화된 증명서 유형 목록 조회")
    @GetMapping("/active")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<CertificateTypeResponse>> getActiveTypes() {
        return ApiResponse.success(certificateTypeService.getActiveTypes());
    }

    @Operation(summary = "증명서 유형 수정")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<CertificateTypeResponse> update(@PathVariable UUID id,
                                                        @Valid @RequestBody UpdateCertificateTypeRequest request) {
        return ApiResponse.success(certificateTypeService.update(id, request));
    }

    @Operation(summary = "증명서 유형 삭제")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public void delete(@PathVariable UUID id) {
        certificateTypeService.delete(id);
    }

    @Operation(summary = "증명서 유형 활성화")
    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Void> activate(@PathVariable UUID id) {
        certificateTypeService.activate(id);
        return ApiResponse.success(null);
    }

    @Operation(summary = "증명서 유형 비활성화")
    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Void> deactivate(@PathVariable UUID id) {
        certificateTypeService.deactivate(id);
        return ApiResponse.success(null);
    }

    @Operation(summary = "증명서 유형 검색")
    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<CertificateTypeResponse>> search(@RequestParam String keyword) {
        return ApiResponse.success(certificateTypeService.search(keyword));
    }
}
