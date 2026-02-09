package com.hrsaas.employee.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.employee.domain.dto.request.CreateCardIssueRequest;
import com.hrsaas.employee.domain.dto.request.ReportLostRequest;
import com.hrsaas.employee.domain.dto.request.RevokeCardRequest;
import com.hrsaas.employee.domain.dto.response.CardIssueRequestResponse;
import com.hrsaas.employee.domain.dto.response.EmployeeCardResponse;
import com.hrsaas.employee.domain.entity.CardStatus;
import com.hrsaas.employee.service.EmployeeCardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/employee-cards")
@RequiredArgsConstructor
@Tag(name = "Employee Card", description = "사원증 관리 API")
public class EmployeeCardController {

    private final EmployeeCardService employeeCardService;

    @GetMapping
    @Operation(summary = "사원증 전체 목록")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Page<EmployeeCardResponse>>> getCards(
            @RequestParam(required = false) CardStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<EmployeeCardResponse> response = employeeCardService.getCards(pageable, status);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my")
    @Operation(summary = "내 사원증 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EmployeeCardResponse>> getMyCard() {
        EmployeeCardResponse response = employeeCardService.getMyCard();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "사원증 상세 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EmployeeCardResponse>> getById(@PathVariable UUID id) {
        EmployeeCardResponse response = employeeCardService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/issue-requests")
    @Operation(summary = "발급 요청 목록")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Page<CardIssueRequestResponse>>> getIssueRequests(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<CardIssueRequestResponse> response = employeeCardService.getIssueRequests(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/issue-requests")
    @Operation(summary = "발급 요청 생성")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CardIssueRequestResponse>> createIssueRequest(
            @Valid @RequestBody CreateCardIssueRequest request) {
        CardIssueRequestResponse response = employeeCardService.createIssueRequest(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "발급 요청 승인")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CardIssueRequestResponse>> approveIssueRequest(@PathVariable UUID id) {
        CardIssueRequestResponse response = employeeCardService.approveIssueRequest(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/revoke")
    @Operation(summary = "사원증 회수")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeCardResponse>> revokeCard(
            @PathVariable UUID id,
            @Valid @RequestBody RevokeCardRequest request) {
        EmployeeCardResponse response = employeeCardService.revokeCard(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/report-lost")
    @Operation(summary = "분실 신고")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EmployeeCardResponse>> reportLost(
            @RequestBody ReportLostRequest request) {
        EmployeeCardResponse response = employeeCardService.reportLost(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
