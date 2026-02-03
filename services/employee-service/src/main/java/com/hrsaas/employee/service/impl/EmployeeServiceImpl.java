package com.hrsaas.employee.service.impl;

import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.domain.dto.request.CreateEmployeeRequest;
import com.hrsaas.employee.domain.dto.request.EmployeeSearchCondition;
import com.hrsaas.employee.domain.dto.request.UpdateEmployeeRequest;
import com.hrsaas.employee.domain.dto.response.EmployeeResponse;
import com.hrsaas.employee.domain.entity.Employee;
import com.hrsaas.employee.domain.event.EmployeeCreatedEvent;
import com.hrsaas.employee.repository.EmployeeRepository;
import com.hrsaas.employee.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EventPublisher eventPublisher;

    @Override
    @Transactional
    @CacheEvict(value = "employee", allEntries = true)
    public EmployeeResponse create(CreateEmployeeRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();

        // Validate uniqueness
        if (employeeRepository.existsByEmployeeNumberAndTenantId(request.getEmployeeNumber(), tenantId)) {
            throw new DuplicateException("EMP_002", "이미 사용 중인 사번입니다: " + request.getEmployeeNumber());
        }

        if (employeeRepository.existsByEmailAndTenantId(request.getEmail(), tenantId)) {
            throw new DuplicateException("EMP_003", "이미 사용 중인 이메일입니다: " + request.getEmail());
        }

        Employee employee = Employee.builder()
            .employeeNumber(request.getEmployeeNumber())
            .name(request.getName())
            .nameEn(request.getNameEn())
            .email(request.getEmail())
            .phone(request.getPhone())
            .mobile(request.getMobile())
            .departmentId(request.getDepartmentId())
            .positionCode(request.getPositionCode())
            .jobTitleCode(request.getJobTitleCode())
            .hireDate(request.getHireDate())
            .employmentType(request.getEmploymentType())
            .managerId(request.getManagerId())
            .build();

        Employee saved = employeeRepository.save(employee);

        // Publish event
        eventPublisher.publish(EmployeeCreatedEvent.of(saved));

        log.info("Employee created: id={}, employeeNumber={}", saved.getId(), saved.getEmployeeNumber());
        return EmployeeResponse.from(saved);
    }

    @Override
    @Cacheable(value = "employee", key = "#id")
    public EmployeeResponse getById(UUID id) {
        Employee employee = findById(id);
        return EmployeeResponse.from(employee);
    }

    @Override
    @Cacheable(value = "employee", key = "'empNo:' + #employeeNumber")
    public EmployeeResponse getByEmployeeNumber(String employeeNumber) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Employee employee = employeeRepository.findByEmployeeNumberAndTenantId(employeeNumber, tenantId)
            .orElseThrow(() -> new NotFoundException("EMP_001", "직원을 찾을 수 없습니다: " + employeeNumber));
        return EmployeeResponse.from(employee);
    }

    @Override
    public PageResponse<EmployeeResponse> search(EmployeeSearchCondition condition, Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();

        Page<Employee> page = employeeRepository.search(
            tenantId,
            condition.getStatus(),
            condition.getDepartmentId(),
            condition.getName(),
            pageable
        );

        return PageResponse.from(page, page.getContent().stream()
            .map(EmployeeResponse::from)
            .toList());
    }

    @Override
    @Transactional
    @CacheEvict(value = "employee", allEntries = true)
    public EmployeeResponse update(UUID id, UpdateEmployeeRequest request) {
        Employee employee = findById(id);

        if (request.getName() != null) {
            employee.setName(request.getName());
        }
        if (request.getNameEn() != null) {
            employee.setNameEn(request.getNameEn());
        }
        if (request.getEmail() != null) {
            employee.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) {
            employee.setPhone(request.getPhone());
        }
        if (request.getMobile() != null) {
            employee.setMobile(request.getMobile());
        }
        if (request.getDepartmentId() != null) {
            employee.setDepartmentId(request.getDepartmentId());
        }
        if (request.getPositionCode() != null) {
            employee.setPositionCode(request.getPositionCode());
        }
        if (request.getJobTitleCode() != null) {
            employee.setJobTitleCode(request.getJobTitleCode());
        }
        if (request.getManagerId() != null) {
            employee.setManagerId(request.getManagerId());
        }

        Employee saved = employeeRepository.save(employee);
        log.info("Employee updated: id={}", id);

        return EmployeeResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "employee", allEntries = true)
    public EmployeeResponse resign(UUID id, String resignDate) {
        Employee employee = findById(id);
        employee.resign(LocalDate.parse(resignDate));
        Employee saved = employeeRepository.save(employee);
        log.info("Employee resigned: id={}, resignDate={}", id, resignDate);
        return EmployeeResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "employee", allEntries = true)
    public void delete(UUID id) {
        Employee employee = findById(id);
        employeeRepository.delete(employee);
        log.info("Employee deleted: id={}", id);
    }

    private Employee findById(UUID id) {
        return employeeRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("EMP_001", "직원을 찾을 수 없습니다: " + id));
    }
}
