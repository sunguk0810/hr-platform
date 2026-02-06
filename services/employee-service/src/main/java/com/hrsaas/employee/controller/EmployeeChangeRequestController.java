package com.hrsaas.employee.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.employee.domain.entity.EmployeeChangeRequest;
import com.hrsaas.employee.service.EmployeeChangeRequestService;
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
 * REST controller for employee self-service change requests.
 */
@RestController
@RequestMapping("/api/v1/employees/me/change-requests")
@RequiredArgsConstructor
@Tag(name = "EmployeeChangeRequest", description = "본인 정보 변경 요청 API")
public class EmployeeChangeRequestController {

    private final EmployeeChangeRequestService changeRequestService;

    /**
     * Create a new change request for the current authenticated employee.
     */
    @PostMapping
    @Operation(summary = "본인 정보 변경 요청")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EmployeeChangeRequest>> create(@RequestBody EmployeeChangeRequest request) {
        UUID employeeId = SecurityContextHolder.getCurrentEmployeeId();
        if (employeeId == null) {
            throw new IllegalStateException("Employee ID not found in security context");
        }
        request.setEmployeeId(employeeId);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(changeRequestService.create(request)));
    }

    /**
     * Get all change requests for the current authenticated employee.
     */
    @GetMapping
    @Operation(summary = "내 변경 요청 목록")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<EmployeeChangeRequest>>> getMyRequests() {
        UUID employeeId = SecurityContextHolder.getCurrentEmployeeId();
        if (employeeId == null) {
            throw new IllegalStateException("Employee ID not found in security context");
        }
        return ResponseEntity.ok(ApiResponse.success(changeRequestService.getByEmployeeId(employeeId)));
    }
}
