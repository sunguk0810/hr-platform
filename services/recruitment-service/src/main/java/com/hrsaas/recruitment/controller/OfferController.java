package com.hrsaas.recruitment.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.recruitment.domain.dto.request.CreateOfferRequest;
import com.hrsaas.recruitment.domain.dto.request.RespondOfferRequest;
import com.hrsaas.recruitment.domain.dto.response.OfferResponse;
import com.hrsaas.recruitment.domain.dto.response.OfferSummaryResponse;
import com.hrsaas.recruitment.domain.entity.OfferStatus;
import com.hrsaas.recruitment.service.OfferService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * 채용 제안 컨트롤러
 */
@Tag(name = "Offer", description = "채용 제안 관리 API")
@RestController
@RequestMapping("/api/v1/offers")
@RequiredArgsConstructor
public class OfferController {

    private final OfferService offerService;

    @Operation(summary = "제안 생성")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<OfferResponse> create(@Valid @RequestBody CreateOfferRequest request) {
        return ApiResponse.success(offerService.create(request));
    }

    @Operation(summary = "제안 상세 조회")
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<OfferResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(offerService.getById(id));
    }

    @Operation(summary = "제안 번호로 조회")
    @GetMapping("/number/{offerNumber}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<OfferResponse> getByOfferNumber(@PathVariable String offerNumber) {
        return ApiResponse.success(offerService.getByOfferNumber(offerNumber));
    }

    @Operation(summary = "지원서별 제안 조회")
    @GetMapping("/application/{applicationId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<OfferResponse> getByApplicationId(@PathVariable UUID applicationId) {
        return ApiResponse.success(offerService.getByApplicationId(applicationId));
    }

    @Operation(summary = "상태별 제안 목록")
    @GetMapping("/status/{status}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<OfferResponse>> getByStatus(
            @PathVariable OfferStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(offerService.getByStatus(status, pageable));
    }

    @Operation(summary = "제안 요약")
    @GetMapping("/summary")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<OfferSummaryResponse> getSummary() {
        return ApiResponse.success(offerService.getSummary());
    }

    @Operation(summary = "승인 대기 제안 목록")
    @GetMapping("/pending-approval")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<List<OfferResponse>> getPendingApproval() {
        return ApiResponse.success(offerService.getPendingApproval());
    }

    @Operation(summary = "승인 요청")
    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<OfferResponse> submitForApproval(@PathVariable UUID id) {
        return ApiResponse.success(offerService.submitForApproval(id));
    }

    @Operation(summary = "승인")
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<OfferResponse> approve(
            @PathVariable UUID id,
            @RequestParam UUID approvedBy) {
        return ApiResponse.success(offerService.approve(id, approvedBy));
    }

    @Operation(summary = "발송")
    @PostMapping("/{id}/send")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<OfferResponse> send(@PathVariable UUID id) {
        return ApiResponse.success(offerService.send(id));
    }

    @Operation(summary = "수락 (공개)")
    @PostMapping("/public/{id}/accept")
    public ApiResponse<OfferResponse> accept(@PathVariable UUID id) {
        return ApiResponse.success(offerService.accept(id));
    }

    @Operation(summary = "거절 (공개)")
    @PostMapping("/public/{id}/decline")
    public ApiResponse<OfferResponse> decline(
            @PathVariable UUID id,
            @RequestParam String reason) {
        return ApiResponse.success(offerService.decline(id, reason));
    }

    @Operation(summary = "협상")
    @PostMapping("/{id}/negotiate")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<OfferResponse> negotiate(
            @PathVariable UUID id,
            @RequestParam String notes) {
        return ApiResponse.success(offerService.negotiate(id, notes));
    }

    @Operation(summary = "취소")
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<OfferResponse> cancel(@PathVariable UUID id) {
        return ApiResponse.success(offerService.cancel(id));
    }

    @Operation(summary = "제안 응답 (수락/거절)")
    @PostMapping("/public/{id}/respond")
    public ApiResponse<OfferResponse> respond(
            @PathVariable UUID id,
            @Valid @RequestBody RespondOfferRequest request) {
        return ApiResponse.success(offerService.respond(id, request.getAction(), request.getReason()));
    }
}
