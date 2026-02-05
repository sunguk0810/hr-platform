package com.hrsaas.organization.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.organization.domain.dto.request.AddCommitteeMemberRequest;
import com.hrsaas.organization.domain.dto.request.CreateCommitteeRequest;
import com.hrsaas.organization.domain.dto.request.UpdateCommitteeRequest;
import com.hrsaas.organization.domain.dto.response.CommitteeResponse;
import com.hrsaas.organization.domain.entity.CommitteeStatus;
import com.hrsaas.organization.domain.entity.CommitteeType;
import com.hrsaas.organization.service.CommitteeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/committees")
@RequiredArgsConstructor
@Tag(name = "Committee", description = "위원회 관리 API")
public class CommitteeController {

    private final CommitteeService committeeService;

    @PostMapping
    @Operation(summary = "위원회 생성")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CommitteeResponse>> create(
            @Valid @RequestBody CreateCommitteeRequest request) {
        CommitteeResponse response = committeeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "위원회 상세 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CommitteeResponse>> getById(@PathVariable UUID id) {
        CommitteeResponse response = committeeService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "위원회 목록 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<CommitteeResponse>>> getAll(
            @RequestParam(required = false) CommitteeStatus status,
            @RequestParam(required = false) CommitteeType type) {
        List<CommitteeResponse> response;
        if (status != null) {
            response = committeeService.getByStatus(status);
        } else if (type != null) {
            response = committeeService.getByType(type);
        } else {
            response = committeeService.getAll();
        }
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "위원회 수정")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CommitteeResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCommitteeRequest request) {
        CommitteeResponse response = committeeService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "위원회 삭제")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        committeeService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "위원회가 삭제되었습니다."));
    }

    @PostMapping("/{id}/dissolve")
    @Operation(summary = "위원회 해산")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> dissolve(@PathVariable UUID id) {
        committeeService.dissolve(id);
        return ResponseEntity.ok(ApiResponse.success(null, "위원회가 해산되었습니다."));
    }

    @GetMapping("/{id}/members")
    @Operation(summary = "위원회 멤버 목록 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<CommitteeResponse.MemberResponse>>> getMembers(
            @PathVariable UUID id) {
        List<CommitteeResponse.MemberResponse> response = committeeService.getMembers(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/members")
    @Operation(summary = "위원회 멤버 추가")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CommitteeResponse.MemberResponse>> addMember(
            @PathVariable UUID id,
            @Valid @RequestBody AddCommitteeMemberRequest request) {
        CommitteeResponse.MemberResponse response = committeeService.addMember(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @DeleteMapping("/{id}/members/{memberId}")
    @Operation(summary = "위원회 멤버 제거")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable UUID id,
            @PathVariable UUID memberId) {
        committeeService.removeMember(id, memberId);
        return ResponseEntity.ok(ApiResponse.success(null, "위원회 멤버가 제거되었습니다."));
    }
}
