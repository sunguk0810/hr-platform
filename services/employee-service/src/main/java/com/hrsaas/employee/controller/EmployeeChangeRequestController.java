package com.hrsaas.employee.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.employee.domain.dto.EmployeeChangeRequestDto;
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
    private final ObjectMapper objectMapper;

    /**
     * Create a new change request for the current authenticated employee.
     */
    @PostMapping
    @Operation(summary = "본인 정보 변경 요청", description = "파일 첨부 지원 (attachmentFileIds)")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EmployeeChangeRequest>> create(@RequestBody EmployeeChangeRequestDto dto) {
        UUID employeeId = SecurityContextHolder.getCurrentEmployeeId();
        if (employeeId == null) {
            throw new IllegalStateException("Employee ID not found in security context");
        }

        // Convert DTO to entity
        EmployeeChangeRequest request = EmployeeChangeRequest.builder()
            .employeeId(employeeId)
            .fieldName(dto.getFieldName())
            .oldValue(dto.getOldValue())
            .newValue(dto.getNewValue())
            .reason(dto.getReason())
            .status("PENDING")
            .build();

        // Convert file IDs list to JSON string
        if (dto.getAttachmentFileIds() != null && !dto.getAttachmentFileIds().isEmpty()) {
            try {
                request.setAttachmentFileIds(objectMapper.writeValueAsString(dto.getAttachmentFileIds()));
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("Failed to serialize attachment file IDs", e);
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(changeRequestService.create(request)));
    }

    /**
     * Get all change requests for the current authenticated employee.
     *
     * @param status Optional filter by status (PENDING, APPROVED, REJECTED)
     */
    @GetMapping
    @Operation(summary = "내 변경 요청 목록", description = "상태별 필터링 가능 (status 파라미터)")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<EmployeeChangeRequest>>> getMyRequests(
        @RequestParam(required = false) String status
    ) {
        UUID employeeId = SecurityContextHolder.getCurrentEmployeeId();
        if (employeeId == null) {
            throw new IllegalStateException("Employee ID not found in security context");
        }
        return ResponseEntity.ok(ApiResponse.success(changeRequestService.getByEmployeeId(employeeId, status)));
    }
}
