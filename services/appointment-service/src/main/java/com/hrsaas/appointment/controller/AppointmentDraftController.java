package com.hrsaas.appointment.controller;

import com.hrsaas.appointment.domain.dto.request.*;
import com.hrsaas.appointment.domain.dto.response.AppointmentDraftResponse;
import com.hrsaas.appointment.domain.dto.response.AppointmentSummary;
import com.hrsaas.appointment.domain.entity.DraftStatus;
import com.hrsaas.appointment.service.AppointmentDraftService;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/appointments/drafts")
@RequiredArgsConstructor
@Tag(name = "Appointment Draft", description = "발령안 관리 API")
public class AppointmentDraftController {

    private final AppointmentDraftService draftService;

    @PostMapping
    @Operation(summary = "발령안 생성")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AppointmentDraftResponse>> create(
            @Valid @RequestBody CreateAppointmentDraftRequest request) {
        AppointmentDraftResponse response = draftService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/summary")
    @Operation(summary = "발령안 상태별 요약 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AppointmentSummary>> getSummary() {
        AppointmentSummary summary = draftService.getSummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/{id}")
    @Operation(summary = "발령안 상세 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AppointmentDraftResponse>> getById(@PathVariable UUID id) {
        AppointmentDraftResponse response = draftService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/number/{draftNumber}")
    @Operation(summary = "발령번호로 발령안 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AppointmentDraftResponse>> getByDraftNumber(
            @PathVariable String draftNumber) {
        AppointmentDraftResponse response = draftService.getByDraftNumber(draftNumber);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "발령안 목록 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<AppointmentDraftResponse>>> search(
            @RequestParam(required = false) DraftStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<AppointmentDraftResponse> page = draftService.search(status, startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "발령안 수정")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AppointmentDraftResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAppointmentDraftRequest request) {
        AppointmentDraftResponse response = draftService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "발령안 삭제")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        draftService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "발령안이 삭제되었습니다."));
    }

    @PostMapping("/{id}/details")
    @Operation(summary = "발령 상세 추가")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AppointmentDraftResponse>> addDetail(
            @PathVariable UUID id,
            @Valid @RequestBody CreateAppointmentDetailRequest request) {
        AppointmentDraftResponse response = draftService.addDetail(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{draftId}/details/{detailId}")
    @Operation(summary = "발령 상세 삭제")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> removeDetail(
            @PathVariable UUID draftId,
            @PathVariable UUID detailId) {
        draftService.removeDetail(draftId, detailId);
        return ResponseEntity.ok(ApiResponse.success(null, "발령 상세가 삭제되었습니다."));
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "발령 결재 요청")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AppointmentDraftResponse>> submit(@PathVariable UUID id) {
        AppointmentDraftResponse response = draftService.submit(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/execute")
    @Operation(summary = "발령 즉시 시행")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AppointmentDraftResponse>> execute(@PathVariable UUID id) {
        AppointmentDraftResponse response = draftService.execute(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/schedule")
    @Operation(summary = "발령 예약 시행")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AppointmentDraftResponse>> schedule(
            @PathVariable UUID id,
            @Valid @RequestBody ScheduleAppointmentRequest request) {
        AppointmentDraftResponse response = draftService.schedule(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "발령 취소")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AppointmentDraftResponse>> cancel(
            @PathVariable UUID id,
            @Valid @RequestBody CancelAppointmentRequest request) {
        AppointmentDraftResponse response = draftService.cancel(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/rollback")
    @Operation(summary = "발령 롤백")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AppointmentDraftResponse>> rollback(@PathVariable UUID id) {
        AppointmentDraftResponse response = draftService.rollback(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
