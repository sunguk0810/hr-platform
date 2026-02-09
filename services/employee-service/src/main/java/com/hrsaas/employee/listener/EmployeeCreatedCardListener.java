package com.hrsaas.employee.listener;

import com.hrsaas.employee.domain.event.EmployeeCreatedEvent;
import com.hrsaas.employee.service.EmployeeCardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Listens for EmployeeCreatedEvent to auto-issue an employee card.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmployeeCreatedCardListener {

    private final EmployeeCardService employeeCardService;

    @TransactionalEventListener
    public void onEmployeeCreated(EmployeeCreatedEvent event) {
        try {
            employeeCardService.autoIssueForNewEmployee(event.getEmployeeId());
            log.info("Auto-issued employee card for new employee: {}", event.getEmployeeId());
        } catch (Exception e) {
            log.error("Failed to auto-issue employee card for employee: {}", event.getEmployeeId(), e);
            // Don't fail the employee creation
        }
    }
}
