package com.hrsaas.employee.service;

import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.domain.entity.EmployeeChangeRequest;
import com.hrsaas.employee.repository.EmployeeChangeRequestRepository;
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

    /**
     * Create a new change request.
     *
     * @param request the change request to create
     * @return the saved change request
     */
    @Transactional
    public EmployeeChangeRequest create(EmployeeChangeRequest request) {
        // TODO: Create approval document via Feign client to approval-service
        return changeRequestRepository.save(request);
    }

    /**
     * Get all change requests for an employee.
     *
     * @param employeeId the employee ID
     * @return list of change requests
     */
    public List<EmployeeChangeRequest> getByEmployeeId(UUID employeeId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return changeRequestRepository.findByEmployeeId(tenantId, employeeId);
    }

    /**
     * Handle the completion of an approval workflow for a change request.
     *
     * @param changeRequestId the change request ID
     * @param approved        whether the change was approved
     */
    @Transactional
    public void handleApprovalCompleted(UUID changeRequestId, boolean approved) {
        EmployeeChangeRequest request = changeRequestRepository.findById(changeRequestId)
            .orElseThrow(() -> new IllegalArgumentException("Change request not found: " + changeRequestId));

        if (approved) {
            request.approve();
            // TODO: Apply the field change to the Employee entity
            log.info("Employee change request approved: id={}, field={}", changeRequestId, request.getFieldName());
        } else {
            request.reject();
            log.info("Employee change request rejected: id={}", changeRequestId);
        }

        changeRequestRepository.save(request);
    }
}
