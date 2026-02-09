package com.hrsaas.employee.service.impl;

import com.hrsaas.common.cache.CacheNames;
import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.core.exception.ValidationException;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.privacy.PrivacyContext;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.domain.dto.request.CreateEmployeeRequest;
import com.hrsaas.employee.domain.dto.request.EmployeeSearchCondition;
import com.hrsaas.employee.domain.dto.request.UpdateEmployeeRequest;
import com.hrsaas.employee.domain.dto.response.BulkImportResultResponse;
import com.hrsaas.employee.domain.dto.response.EmployeeResponse;
import com.hrsaas.employee.domain.entity.Employee;
import com.hrsaas.employee.domain.entity.EmployeeStatus;
import com.hrsaas.employee.domain.event.EmployeeCreatedEvent;
import com.hrsaas.employee.repository.EmployeeRepository;
import com.hrsaas.employee.service.EmployeeHistoryRecorder;
import com.hrsaas.employee.service.EmployeeService;
import com.hrsaas.employee.service.ExcelEmployeeService;
import com.hrsaas.employee.service.OrganizationValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EventPublisher eventPublisher;
    private final PrivacyAuditServiceImpl privacyAuditService;
    private final EmployeeHistoryRecorder historyRecorder;
    private final OrganizationValidationService organizationValidationService;
    private final ExcelEmployeeService excelEmployeeService;

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.EMPLOYEE, allEntries = true)
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
    @Cacheable(value = CacheNames.EMPLOYEE, key = "#id")
    public EmployeeResponse getById(UUID id) {
        // Set viewing employee ID for privacy context (determines if masking should be applied)
        PrivacyContext.setViewingEmployeeId(id);
        Employee employee = findById(id);
        return EmployeeResponse.from(employee);
    }

    @Override
    @Cacheable(value = CacheNames.EMPLOYEE, key = "'empNo:' + #employeeNumber")
    public EmployeeResponse getByEmployeeNumber(String employeeNumber) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Employee employee = employeeRepository.findByEmployeeNumberAndTenantId(employeeNumber, tenantId)
            .orElseThrow(() -> new NotFoundException("EMP_001", "직원을 찾을 수 없습니다: " + employeeNumber));
        // Set viewing employee ID for privacy context
        PrivacyContext.setViewingEmployeeId(employee.getId());
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
    @CacheEvict(value = CacheNames.EMPLOYEE, allEntries = true)
    public EmployeeResponse update(UUID id, UpdateEmployeeRequest request) {
        Employee employee = findById(id);

        // Capture old values for history tracking
        UUID oldDeptId = employee.getDepartmentId();
        String oldPositionCode = employee.getPositionCode();
        String oldJobTitleCode = employee.getJobTitleCode();

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
            organizationValidationService.validateDepartment(request.getDepartmentId());
            employee.setDepartmentId(request.getDepartmentId());
        }
        if (request.getPositionCode() != null) {
            organizationValidationService.validatePosition(request.getPositionCode());
            employee.setPositionCode(request.getPositionCode());
        }
        if (request.getJobTitleCode() != null) {
            organizationValidationService.validateGrade(request.getJobTitleCode());
            employee.setJobTitleCode(request.getJobTitleCode());
        }
        if (request.getManagerId() != null) {
            employee.setManagerId(request.getManagerId());
        }

        Employee saved = employeeRepository.save(employee);

        // Record history for org changes
        if (request.getDepartmentId() != null && !request.getDepartmentId().equals(oldDeptId)) {
            historyRecorder.recordDepartmentChange(saved, oldDeptId, request.getDepartmentId(), "부서 변경");
        }
        if (request.getPositionCode() != null && !request.getPositionCode().equals(oldPositionCode)) {
            historyRecorder.recordPositionChange(saved, oldPositionCode, request.getPositionCode(), "직책 변경");
        }
        if (request.getJobTitleCode() != null && !request.getJobTitleCode().equals(oldJobTitleCode)) {
            historyRecorder.recordGradeChange(saved, oldJobTitleCode, request.getJobTitleCode(), "직급 변경");
        }

        log.info("Employee updated: id={}", id);

        return EmployeeResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.EMPLOYEE, allEntries = true)
    public EmployeeResponse resign(UUID id, String resignDate) {
        Employee employee = findById(id);
        employee.resign(LocalDate.parse(resignDate));
        Employee saved = employeeRepository.save(employee);
        log.info("Employee resigned: id={}, resignDate={}", id, resignDate);
        return EmployeeResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.EMPLOYEE, allEntries = true)
    public void delete(UUID id) {
        Employee employee = findById(id);
        employee.resign(LocalDate.now());
        employeeRepository.save(employee);
        log.info("Employee soft-deleted (resigned): id={}", id);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.EMPLOYEE, allEntries = true)
    public EmployeeResponse cancelResign(UUID id, String reason) {
        Employee employee = findById(id);

        if (employee.getStatus() != EmployeeStatus.RESIGNED) {
            throw new ValidationException("EMP_004", "퇴사 상태의 직원만 퇴사를 취소할 수 있습니다.");
        }

        employee.cancelResign();
        Employee saved = employeeRepository.save(employee);

        log.info("Employee resign cancelled: id={}, reason={}", id, reason);

        return EmployeeResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.EMPLOYEE, allEntries = true)
    public int bulkDelete(List<UUID> ids) {
        int resigned = 0;
        for (UUID id : ids) {
            try {
                Employee employee = findById(id);
                employee.resign(LocalDate.now());
                employeeRepository.save(employee);
                resigned++;
            } catch (NotFoundException e) {
                log.warn("Employee not found for bulk delete: id={}", id);
            }
        }
        log.info("Bulk soft-delete completed: requested={}, resigned={}", ids.size(), resigned);
        return resigned;
    }

    @Override
    public byte[] exportToExcel(EmployeeSearchCondition condition) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<Employee> page = employeeRepository.search(
            tenantId, condition.getStatus(), condition.getDepartmentId(),
            condition.getName(), org.springframework.data.domain.Pageable.unpaged());
        return excelEmployeeService.exportToExcel(page.getContent());
    }

    @Override
    @Transactional
    public BulkImportResultResponse importFromExcel(MultipartFile file) {
        log.info("Import from Excel requested: filename={}", file.getOriginalFilename());

        try {
            List<com.hrsaas.employee.domain.dto.request.CreateEmployeeRequest> requests =
                excelEmployeeService.importFromExcel(file.getInputStream());

            int successCount = 0;
            int failedCount = 0;
            for (var request : requests) {
                try {
                    create(request);
                    successCount++;
                } catch (Exception e) {
                    log.warn("Failed to import employee: {}", request.getEmployeeNumber(), e);
                    failedCount++;
                }
            }

            return BulkImportResultResponse.builder()
                .success(failedCount == 0)
                .processedAt(Instant.now())
                .totalRequested(requests.size())
                .successCount(successCount)
                .failedCount(failedCount)
                .skippedCount(0)
                .build();
        } catch (Exception e) {
            log.error("Excel import failed", e);
            return BulkImportResultResponse.builder()
                .success(false)
                .processedAt(Instant.now())
                .totalRequested(0)
                .successCount(0)
                .failedCount(1)
                .skippedCount(0)
                .build();
        }
    }

    @Override
    public byte[] getImportTemplate() {
        return excelEmployeeService.generateTemplate();
    }

    @Override
    public String unmask(UUID id, String field, String reason) {
        // 1. Validate reason
        if (reason == null || reason.length() < 10) {
            throw new ValidationException("EMP_030", "열람 사유는 10자 이상 입력해야 합니다.");
        }

        // 2. Log audit trail
        privacyAuditService.logAccess(id, field, reason);

        // 3. Return unmasked value
        Employee employee = findById(id);
        log.info("Unmask requested: employeeId={}, field={}, reason={}", id, field, reason);

        return switch (field) {
            case "phone" -> employee.getPhone();
            case "mobile" -> employee.getMobile();
            case "email" -> employee.getEmail();
            case "residentNumber" -> employee.getResidentNumber();
            default -> throw new ValidationException("EMP_005", "지원하지 않는 필드입니다: " + field);
        };
    }

    @Override
    public long countByDepartment(UUID departmentId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return employeeRepository.countByDepartmentIdAndTenantId(departmentId, tenantId);
    }

    @Override
    public long countByPosition(String positionCode) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return employeeRepository.countByPositionCodeAndTenantId(positionCode, tenantId);
    }

    @Override
    public long countByGrade(String jobTitleCode) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return employeeRepository.countByJobTitleCodeAndTenantId(jobTitleCode, tenantId);
    }

    @Override
    public boolean existsById(UUID id) {
        return employeeRepository.existsById(id);
    }

    Employee findById(UUID id) {
        return employeeRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("EMP_001", "직원을 찾을 수 없습니다: " + id));
    }
}
