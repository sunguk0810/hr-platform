package com.hrsaas.employee.service;

import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.domain.entity.EmployeeAffiliation;
import com.hrsaas.employee.domain.event.EmployeeAffiliationChangedEvent;
import com.hrsaas.employee.repository.EmployeeAffiliationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service for managing employee affiliations (primary, secondary, concurrent department assignments).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AffiliationService {

    private final EmployeeAffiliationRepository affiliationRepository;
    private final EventPublisher eventPublisher;

    /**
     * Get active affiliations for an employee.
     *
     * @param employeeId the employee ID
     * @return list of active affiliations
     */
    public List<EmployeeAffiliation> getByEmployeeId(UUID employeeId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return affiliationRepository.findActiveByEmployeeId(tenantId, employeeId);
    }

    /**
     * Get all affiliations (including inactive) for an employee.
     *
     * @param employeeId the employee ID
     * @return list of all affiliations
     */
    public List<EmployeeAffiliation> getAllByEmployeeId(UUID employeeId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return affiliationRepository.findAllByEmployeeId(tenantId, employeeId);
    }

    /**
     * Add a new affiliation for an employee.
     *
     * @param affiliation the affiliation to add
     * @return the saved affiliation
     */
    @Transactional
    public EmployeeAffiliation addAffiliation(EmployeeAffiliation affiliation) {
        EmployeeAffiliation saved = affiliationRepository.save(affiliation);

        eventPublisher.publish(EmployeeAffiliationChangedEvent.builder()
            .employeeId(affiliation.getEmployeeId())
            .departmentId(affiliation.getDepartmentId())
            .affiliationType(affiliation.getAffiliationType())
            .action("ADDED")
            .build());

        log.info("Affiliation added: employeeId={}, departmentId={}, type={}",
            affiliation.getEmployeeId(), affiliation.getDepartmentId(), affiliation.getAffiliationType());
        return saved;
    }

    /**
     * Update an existing affiliation.
     *
     * @param affiliationId the ID of the affiliation to update
     * @param updated       the updated affiliation data
     * @return the updated affiliation
     */
    @Transactional
    public EmployeeAffiliation updateAffiliation(UUID affiliationId, EmployeeAffiliation updated) {
        EmployeeAffiliation affiliation = affiliationRepository.findById(affiliationId)
            .orElseThrow(() -> new IllegalArgumentException("Affiliation not found: " + affiliationId));

        affiliation.setDepartmentId(updated.getDepartmentId());
        affiliation.setDepartmentName(updated.getDepartmentName());
        affiliation.setPositionCode(updated.getPositionCode());
        affiliation.setPositionName(updated.getPositionName());
        affiliation.setAffiliationType(updated.getAffiliationType());
        affiliation.setStartDate(updated.getStartDate());
        affiliation.setEndDate(updated.getEndDate());

        return affiliationRepository.save(affiliation);
    }

    /**
     * Remove (deactivate) an affiliation.
     *
     * @param affiliationId the ID of the affiliation to remove
     */
    @Transactional
    public void removeAffiliation(UUID affiliationId) {
        EmployeeAffiliation affiliation = affiliationRepository.findById(affiliationId)
            .orElseThrow(() -> new IllegalArgumentException("Affiliation not found: " + affiliationId));

        affiliation.deactivate();
        affiliationRepository.save(affiliation);

        eventPublisher.publish(EmployeeAffiliationChangedEvent.builder()
            .employeeId(affiliation.getEmployeeId())
            .departmentId(affiliation.getDepartmentId())
            .affiliationType(affiliation.getAffiliationType())
            .action("REMOVED")
            .build());

        log.info("Affiliation removed: id={}, employeeId={}", affiliationId, affiliation.getEmployeeId());
    }
}
