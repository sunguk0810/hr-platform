package com.hrsaas.employee.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.employee.domain.entity.EmployeeAffiliation;
import com.hrsaas.employee.service.AffiliationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for managing employee affiliations (concurrent/secondary department assignments).
 */
@RestController
@RequestMapping("/api/v1/employees/{employeeId}/affiliations")
@RequiredArgsConstructor
@Tag(name = "EmployeeAffiliation", description = "겸직/소속 관리 API")
public class AffiliationController {

    private final AffiliationService affiliationService;

    /**
     * Get active affiliations for an employee.
     */
    @GetMapping
    @Operation(summary = "소속 목록 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<EmployeeAffiliation>>> getAffiliations(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(ApiResponse.success(affiliationService.getByEmployeeId(employeeId)));
    }

    /**
     * Add a new affiliation for an employee.
     */
    @PostMapping
    @Operation(summary = "소속 추가")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeAffiliation>> addAffiliation(
            @PathVariable UUID employeeId, @RequestBody EmployeeAffiliation affiliation) {
        affiliation.setEmployeeId(employeeId);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(affiliationService.addAffiliation(affiliation)));
    }

    /**
     * Update an existing affiliation.
     */
    @PutMapping("/{affiliationId}")
    @Operation(summary = "소속 수정")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeAffiliation>> updateAffiliation(
            @PathVariable UUID employeeId, @PathVariable UUID affiliationId,
            @RequestBody EmployeeAffiliation affiliation) {
        return ResponseEntity.ok(ApiResponse.success(affiliationService.updateAffiliation(affiliationId, affiliation)));
    }

    /**
     * Remove (deactivate) an affiliation.
     */
    @DeleteMapping("/{affiliationId}")
    @Operation(summary = "소속 제거")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> removeAffiliation(
            @PathVariable UUID employeeId, @PathVariable UUID affiliationId) {
        affiliationService.removeAffiliation(affiliationId);
        return ResponseEntity.ok(ApiResponse.success(null, "소속이 제거되었습니다."));
    }
}
