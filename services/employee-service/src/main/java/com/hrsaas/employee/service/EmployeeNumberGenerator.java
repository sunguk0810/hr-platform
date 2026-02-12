package com.hrsaas.employee.service;

import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.domain.entity.Employee;
import com.hrsaas.employee.domain.entity.EmployeeNumberRule;
import com.hrsaas.employee.domain.entity.EmployeeStatus;
import com.hrsaas.employee.repository.EmployeeNumberRuleRepository;
import com.hrsaas.employee.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Service for generating employee numbers based on tenant-specific rules.
 * Uses pessimistic locking to ensure unique sequence numbers in concurrent environments.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmployeeNumberGenerator {

    private final EmployeeNumberRuleRepository ruleRepository;
    private final EmployeeRepository employeeRepository;

    /**
     * Generate an employee number based on the tenant's configured rule.
     * If no rule is configured, falls back to a simple year-sequence pattern.
     *
     * @param hireDate the hire date used for year extraction
     * @return the generated employee number (e.g., "HR-2026-0001")
     */
    @Transactional
    public String generate(LocalDate hireDate) {
        UUID tenantId = TenantContext.getCurrentTenant();

        EmployeeNumberRule rule = ruleRepository.findActiveByTenantIdForUpdate(tenantId)
            .orElse(null);

        if (rule == null) {
            // No rule configured, generate simple sequential number
            return generateSimpleNumber(tenantId, hireDate);
        }

        int year = hireDate != null ? hireDate.getYear() : LocalDate.now().getYear();
        int sequence = rule.getNextSequence(year);
        ruleRepository.save(rule);

        StringBuilder sb = new StringBuilder();

        // Prefix
        if (rule.getPrefix() != null && !rule.getPrefix().isEmpty()) {
            sb.append(rule.getPrefix());
        }

        // Year
        if (rule.getIncludeYear()) {
            if (sb.length() > 0 && rule.getSeparator() != null) {
                sb.append(rule.getSeparator());
            }
            String yearStr = "YY".equals(rule.getYearFormat())
                ? String.valueOf(year % 100)
                : String.valueOf(year);
            sb.append(yearStr);
        }

        // Sequence
        if (sb.length() > 0 && rule.getSeparator() != null) {
            sb.append(rule.getSeparator());
        }
        String seqStr = String.format("%0" + rule.getSequenceDigits() + "d", sequence);
        sb.append(seqStr);

        String employeeNumber = sb.toString();
        log.info("Generated employee number: {} (tenant={}, sequence={})", employeeNumber, tenantId, sequence);
        return employeeNumber;
    }

    /**
     * Fallback method to generate a simple employee number when no rule is configured.
     */
    private String generateSimpleNumber(UUID tenantId, LocalDate hireDate) {
        int year = hireDate != null ? hireDate.getYear() : LocalDate.now().getYear();
        String prefix = String.valueOf(year);
        long count = employeeRepository.count() + 1;
        return prefix + "-" + String.format("%04d", count);
    }

    /**
     * Find an existing employee number for rehire cases (when allowReuse is enabled).
     *
     * @param tenantId  the tenant ID
     * @param name      the employee name
     * @param birthDate the employee birth date
     * @return the existing employee number, or null if not found or reuse is not allowed
     */
    @Transactional(readOnly = true)
    public String findExistingNumber(UUID tenantId, String name, LocalDate birthDate) {
        EmployeeNumberRule rule = ruleRepository.findActiveByTenantId(tenantId).orElse(null);
        if (rule == null || !rule.getAllowReuse()) {
            return null;
        }
        return employeeRepository.findTopByTenantIdAndNameAndBirthDateAndStatusOrderByResignDateDesc(
                tenantId, name, birthDate, EmployeeStatus.RESIGNED)
            .map(Employee::getEmployeeNumber)
            .orElse(null);
    }
}
