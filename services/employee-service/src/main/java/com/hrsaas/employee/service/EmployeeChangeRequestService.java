package com.hrsaas.employee.service;

import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.client.ApprovalServiceClient;
import com.hrsaas.employee.client.dto.CreateApprovalClientRequest;
import com.hrsaas.employee.domain.entity.Employee;
import com.hrsaas.employee.domain.entity.EmployeeChangeRequest;
import com.hrsaas.employee.repository.EmployeeChangeRequestRepository;
import com.hrsaas.employee.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing employee self-service change requests.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeChangeRequestService {

    private final EmployeeChangeRequestRepository changeRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final ApprovalServiceClient approvalServiceClient;

    // 변경 가능한 필드 (일반)
    private static final Set<String> ALLOWED_FIELDS = Set.of(
        "phone", "mobile", "email", "nameEn", "address", "emergencyContact", "emergencyPhone"
    );

    // 특별 승인 필요 필드 (HR 관리자만 변경 가능)
    private static final Set<String> RESTRICTED_FIELDS = Set.of(
        "residentNumber", "bankAccount", "bankName", "accountHolder"
    );

    // 셀프 서비스로 변경 불가 필드
    private static final Set<String> FORBIDDEN_FIELDS = Set.of(
        "employeeNumber", "status", "departmentId", "positionCode", "gradeCode",
        "joinDate", "resignDate", "employmentType"
    );

    // 월간 변경 요청 제한 (3회)
    private static final int MONTHLY_REQUEST_LIMIT = 3;

    /**
     * Validate field access permissions.
     * @throws IllegalArgumentException if field is forbidden
     */
    private void validateFieldAccess(String fieldName) {
        if (FORBIDDEN_FIELDS.contains(fieldName)) {
            throw new IllegalArgumentException("Field '" + fieldName + "' cannot be changed via self-service");
        }
    }

    /**
     * Validate monthly request limit (3 requests per month).
     * @throws IllegalStateException if monthly limit exceeded
     */
    private void validateMonthlyLimit(UUID employeeId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        YearMonth currentMonth = YearMonth.now();
        LocalDateTime monthStart = currentMonth.atDay(1).atStartOfDay();
        LocalDateTime monthEnd = currentMonth.atEndOfMonth().atTime(23, 59, 59);

        long requestCount = changeRequestRepository.countByEmployeeIdAndCreatedAtBetween(
            tenantId, employeeId, monthStart, monthEnd
        );

        if (requestCount >= MONTHLY_REQUEST_LIMIT) {
            throw new IllegalStateException(
                "Monthly request limit exceeded. Maximum " + MONTHLY_REQUEST_LIMIT + " requests per month allowed."
            );
        }
    }

    /**
     * Create a new change request and submit to approval service.
     */
    @Transactional
    public EmployeeChangeRequest create(EmployeeChangeRequest request) {
        // Validate field access
        validateFieldAccess(request.getFieldName());

        // Validate monthly limit
        validateMonthlyLimit(request.getEmployeeId());

        EmployeeChangeRequest saved = changeRequestRepository.save(request);

        try {
            var approvalRequest = CreateApprovalClientRequest.builder()
                .documentType("EMPLOYEE_CHANGE")
                .referenceId(saved.getId())
                .title("본인정보 변경 요청 - " + saved.getFieldName())
                .content(saved.getFieldName() + ": " + saved.getOldValue() + " → " + saved.getNewValue())
                .build();
            var response = approvalServiceClient.createApproval(approvalRequest);
            if (response != null && response.getData() != null) {
                saved.setApprovalDocumentId(response.getData().getApprovalId());
                changeRequestRepository.save(saved);
            }
        } catch (Exception e) {
            log.warn("Failed to create approval for change request: id={}", saved.getId(), e);
        }

        return saved;
    }

    /**
     * Get all change requests for an employee.
     */
    public List<EmployeeChangeRequest> getByEmployeeId(UUID employeeId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return changeRequestRepository.findByEmployeeId(tenantId, employeeId);
    }

    /**
     * Get change requests for an employee filtered by status.
     */
    public List<EmployeeChangeRequest> getByEmployeeId(UUID employeeId, String status) {
        UUID tenantId = TenantContext.getCurrentTenant();
        if (status == null || status.isBlank()) {
            return changeRequestRepository.findByEmployeeId(tenantId, employeeId);
        }
        return changeRequestRepository.findByEmployeeIdAndStatus(tenantId, employeeId, status);
    }

    /**
     * Handle the completion of an approval workflow for a change request.
     * When approved, apply the actual field change to the Employee entity.
     *
     * @param changeRequestId The change request ID
     * @param approved Whether the request was approved
     * @param actionBy User who approved/rejected
     * @param rejectionReason Reason for rejection (if applicable)
     */
    @Transactional
    public void handleApprovalCompleted(UUID changeRequestId, boolean approved, UUID actionBy, String rejectionReason) {
        EmployeeChangeRequest request = changeRequestRepository.findById(changeRequestId)
            .orElseThrow(() -> new IllegalArgumentException("Change request not found: " + changeRequestId));

        if (approved) {
            request.approve(actionBy);

            // Apply the field change to the Employee entity
            Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElse(null);
            if (employee != null) {
                applyFieldChange(employee, request.getFieldName(), request.getNewValue());
                employeeRepository.save(employee);
                log.info("Employee field change applied: employeeId={}, field={}, newValue={}, approvedBy={}",
                    request.getEmployeeId(), request.getFieldName(), request.getNewValue(), actionBy);
            }
        } else {
            request.reject(actionBy, rejectionReason);
            log.info("Employee change request rejected: id={}, rejectedBy={}, reason={}",
                changeRequestId, actionBy, rejectionReason);
        }

        changeRequestRepository.save(request);
    }

    private void applyFieldChange(Employee employee, String fieldName, String newValue) {
        switch (fieldName) {
            case "phone" -> employee.setPhone(newValue);
            case "mobile" -> employee.setMobile(newValue);
            case "email" -> employee.setEmail(newValue);
            case "nameEn" -> employee.setNameEn(newValue);
            default -> log.warn("Unknown field for change request: {}", fieldName);
        }
    }
}
