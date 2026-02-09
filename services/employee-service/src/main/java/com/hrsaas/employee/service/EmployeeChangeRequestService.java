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

import java.util.List;
import java.util.UUID;

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

    /**
     * Create a new change request and submit to approval service.
     */
    @Transactional
    public EmployeeChangeRequest create(EmployeeChangeRequest request) {
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
     * Handle the completion of an approval workflow for a change request.
     * When approved, apply the actual field change to the Employee entity.
     */
    @Transactional
    public void handleApprovalCompleted(UUID changeRequestId, boolean approved) {
        EmployeeChangeRequest request = changeRequestRepository.findById(changeRequestId)
            .orElseThrow(() -> new IllegalArgumentException("Change request not found: " + changeRequestId));

        if (approved) {
            request.approve();

            // Apply the field change to the Employee entity
            Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElse(null);
            if (employee != null) {
                applyFieldChange(employee, request.getFieldName(), request.getNewValue());
                employeeRepository.save(employee);
                log.info("Employee field change applied: employeeId={}, field={}, newValue={}",
                    request.getEmployeeId(), request.getFieldName(), request.getNewValue());
            }
        } else {
            request.reject();
            log.info("Employee change request rejected: id={}", changeRequestId);
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
