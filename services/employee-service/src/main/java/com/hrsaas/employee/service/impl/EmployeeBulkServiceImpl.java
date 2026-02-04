package com.hrsaas.employee.service.impl;

import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.domain.dto.request.BulkEmployeeImportRequest;
import com.hrsaas.employee.domain.dto.request.BulkEmployeeRequest;
import com.hrsaas.employee.domain.dto.response.BulkImportResultResponse;
import com.hrsaas.employee.domain.entity.Employee;
import com.hrsaas.employee.domain.entity.EmploymentType;
import com.hrsaas.employee.domain.event.EmployeeCreatedEvent;
import com.hrsaas.employee.repository.EmployeeRepository;
import com.hrsaas.employee.service.EmployeeBulkService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeBulkServiceImpl implements EmployeeBulkService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    private final EmployeeRepository employeeRepository;
    private final EventPublisher eventPublisher;

    @Override
    @Transactional
    @CacheEvict(value = "employee", allEntries = true)
    public BulkImportResultResponse importEmployees(BulkEmployeeImportRequest request) {
        log.info("Starting bulk employee import: {} employees, validateOnly={}, rollbackOnError={}",
                 request.getEmployees().size(), request.isValidateOnly(), request.isRollbackOnError());

        if (request.isValidateOnly()) {
            return validateImport(request);
        }

        UUID tenantId = TenantContext.getCurrentTenant();
        BulkImportResultResponse result = BulkImportResultResponse.builder()
            .totalRequested(request.getEmployees().size())
            .processedAt(Instant.now())
            .build();

        // 사전 검증: 중복 체크를 위한 기존 데이터 조회
        Set<String> existingEmployeeNumbers = new HashSet<>();
        Set<String> existingEmails = new HashSet<>();
        Map<String, UUID> employeeNumberToIdMap = new HashMap<>();

        // 요청 내 중복 검사용
        Set<String> requestedEmployeeNumbers = new HashSet<>();
        Set<String> requestedEmails = new HashSet<>();

        List<Employee> employeesToSave = new ArrayList<>();
        int rowNumber = 0;
        int skippedCount = 0;

        for (BulkEmployeeRequest empRequest : request.getEmployees()) {
            rowNumber++;

            // 기본 유효성 검사
            List<String> validationErrors = validateEmployeeRequest(empRequest, rowNumber);
            if (!validationErrors.isEmpty()) {
                for (String error : validationErrors) {
                    result.addError(rowNumber, empRequest.getEmployeeNumber(),
                        empRequest.getName(), null, error);
                }
                continue;
            }

            // 요청 내 중복 체크
            if (requestedEmployeeNumbers.contains(empRequest.getEmployeeNumber())) {
                result.addError(rowNumber, empRequest.getEmployeeNumber(),
                    empRequest.getName(), "employeeNumber", "요청 내 중복된 사번입니다");
                continue;
            }
            requestedEmployeeNumbers.add(empRequest.getEmployeeNumber());

            if (requestedEmails.contains(empRequest.getEmail())) {
                result.addError(rowNumber, empRequest.getEmployeeNumber(),
                    empRequest.getName(), "email", "요청 내 중복된 이메일입니다");
                continue;
            }
            requestedEmails.add(empRequest.getEmail());

            // DB 중복 체크
            if (employeeRepository.existsByEmployeeNumberAndTenantId(empRequest.getEmployeeNumber(), tenantId)) {
                if (request.isSkipDuplicates()) {
                    result.addWarning(rowNumber, empRequest.getEmployeeNumber(),
                        "이미 존재하는 사번입니다 (건너뜀)");
                    skippedCount++;
                    continue;
                } else {
                    result.addError(rowNumber, empRequest.getEmployeeNumber(),
                        empRequest.getName(), "employeeNumber", "이미 존재하는 사번입니다");
                    continue;
                }
            }

            if (employeeRepository.existsByEmailAndTenantId(empRequest.getEmail(), tenantId)) {
                if (request.isSkipDuplicates()) {
                    result.addWarning(rowNumber, empRequest.getEmployeeNumber(),
                        "이미 존재하는 이메일입니다 (건너뜀)");
                    skippedCount++;
                    continue;
                } else {
                    result.addError(rowNumber, empRequest.getEmployeeNumber(),
                        empRequest.getName(), "email", "이미 존재하는 이메일입니다");
                    continue;
                }
            }

            // 관리자 ID 조회
            UUID managerId = null;
            if (StringUtils.hasText(empRequest.getManagerEmployeeNumber())) {
                Optional<Employee> manager = employeeRepository.findByEmployeeNumberAndTenantId(
                    empRequest.getManagerEmployeeNumber(), tenantId);
                if (manager.isPresent()) {
                    managerId = manager.get().getId();
                } else {
                    result.addWarning(rowNumber, empRequest.getEmployeeNumber(),
                        "관리자 사번을 찾을 수 없습니다: " + empRequest.getManagerEmployeeNumber());
                }
            }

            // Employee 엔티티 생성
            Employee employee = Employee.builder()
                .employeeNumber(empRequest.getEmployeeNumber())
                .name(empRequest.getName())
                .nameEn(empRequest.getNameEn())
                .email(empRequest.getEmail())
                .phone(empRequest.getPhone())
                .mobile(empRequest.getMobile())
                .positionCode(empRequest.getPositionCode())
                .jobTitleCode(empRequest.getJobTitleCode())
                .hireDate(empRequest.getHireDate())
                .employmentType(empRequest.getEmploymentType() != null ?
                    empRequest.getEmploymentType() : EmploymentType.REGULAR)
                .managerId(managerId)
                .build();

            employeesToSave.add(employee);
        }

        // 에러가 있고 rollbackOnError가 true면 저장하지 않음
        if (result.hasErrors() && request.isRollbackOnError()) {
            result.setSuccess(false);
            result.setSuccessCount(0);
            result.setFailedCount(result.getErrors().size());
            result.setSkippedCount(skippedCount);
            log.warn("Bulk import aborted due to errors: {} errors", result.getErrors().size());
            return result;
        }

        // 저장 및 이벤트 발행
        int successCount = 0;
        for (int i = 0; i < employeesToSave.size(); i++) {
            Employee employee = employeesToSave.get(i);
            try {
                Employee saved = employeeRepository.save(employee);
                eventPublisher.publish(EmployeeCreatedEvent.of(saved));

                result.addImportedEmployee(i + 1, saved.getId(),
                    saved.getEmployeeNumber(), saved.getName(), saved.getEmail());
                successCount++;
            } catch (Exception e) {
                log.error("Failed to save employee: {}", employee.getEmployeeNumber(), e);
                result.addError(i + 1, employee.getEmployeeNumber(),
                    employee.getName(), null, "저장 실패: " + e.getMessage());
            }
        }

        result.setSuccess(!result.hasErrors() || !request.isRollbackOnError());
        result.setSuccessCount(successCount);
        result.setFailedCount(result.getErrors().size());
        result.setSkippedCount(skippedCount);

        log.info("Bulk import completed: success={}, failed={}, skipped={}",
                 successCount, result.getFailedCount(), skippedCount);

        return result;
    }

    @Override
    public BulkImportResultResponse validateImport(BulkEmployeeImportRequest request) {
        log.info("Validating bulk employee import: {} employees", request.getEmployees().size());

        UUID tenantId = TenantContext.getCurrentTenant();
        BulkImportResultResponse result = BulkImportResultResponse.builder()
            .totalRequested(request.getEmployees().size())
            .processedAt(Instant.now())
            .build();

        Set<String> requestedEmployeeNumbers = new HashSet<>();
        Set<String> requestedEmails = new HashSet<>();

        int rowNumber = 0;
        int potentialSuccess = 0;
        int potentialSkips = 0;

        for (BulkEmployeeRequest empRequest : request.getEmployees()) {
            rowNumber++;

            // 기본 유효성 검사
            List<String> validationErrors = validateEmployeeRequest(empRequest, rowNumber);
            if (!validationErrors.isEmpty()) {
                for (String error : validationErrors) {
                    result.addError(rowNumber, empRequest.getEmployeeNumber(),
                        empRequest.getName(), null, error);
                }
                continue;
            }

            // 요청 내 중복 체크
            if (requestedEmployeeNumbers.contains(empRequest.getEmployeeNumber())) {
                result.addError(rowNumber, empRequest.getEmployeeNumber(),
                    empRequest.getName(), "employeeNumber", "요청 내 중복된 사번입니다");
                continue;
            }
            requestedEmployeeNumbers.add(empRequest.getEmployeeNumber());

            if (requestedEmails.contains(empRequest.getEmail())) {
                result.addError(rowNumber, empRequest.getEmployeeNumber(),
                    empRequest.getName(), "email", "요청 내 중복된 이메일입니다");
                continue;
            }
            requestedEmails.add(empRequest.getEmail());

            // DB 중복 체크
            boolean employeeNumberExists = employeeRepository.existsByEmployeeNumberAndTenantId(
                empRequest.getEmployeeNumber(), tenantId);
            boolean emailExists = employeeRepository.existsByEmailAndTenantId(
                empRequest.getEmail(), tenantId);

            if (employeeNumberExists || emailExists) {
                if (request.isSkipDuplicates()) {
                    String reason = employeeNumberExists ? "이미 존재하는 사번" : "이미 존재하는 이메일";
                    result.addWarning(rowNumber, empRequest.getEmployeeNumber(),
                        reason + " (건너뜀 예정)");
                    potentialSkips++;
                } else {
                    if (employeeNumberExists) {
                        result.addError(rowNumber, empRequest.getEmployeeNumber(),
                            empRequest.getName(), "employeeNumber", "이미 존재하는 사번입니다");
                    }
                    if (emailExists) {
                        result.addError(rowNumber, empRequest.getEmployeeNumber(),
                            empRequest.getName(), "email", "이미 존재하는 이메일입니다");
                    }
                }
                continue;
            }

            potentialSuccess++;
        }

        result.setSuccess(!result.hasErrors());
        result.setSuccessCount(potentialSuccess);
        result.setFailedCount(result.getErrors().size());
        result.setSkippedCount(potentialSkips);

        log.info("Validation completed: potential success={}, errors={}, skips={}",
                 potentialSuccess, result.getErrors().size(), potentialSkips);

        return result;
    }

    private List<String> validateEmployeeRequest(BulkEmployeeRequest request, int rowNumber) {
        List<String> errors = new ArrayList<>();

        if (!StringUtils.hasText(request.getEmployeeNumber())) {
            errors.add("사번이 비어있습니다");
        } else if (request.getEmployeeNumber().length() > 50) {
            errors.add("사번은 50자 이하여야 합니다");
        }

        if (!StringUtils.hasText(request.getName())) {
            errors.add("이름이 비어있습니다");
        } else if (request.getName().length() > 100) {
            errors.add("이름은 100자 이하여야 합니다");
        }

        if (!StringUtils.hasText(request.getEmail())) {
            errors.add("이메일이 비어있습니다");
        } else if (!EMAIL_PATTERN.matcher(request.getEmail()).matches()) {
            errors.add("올바른 이메일 형식이 아닙니다");
        } else if (request.getEmail().length() > 200) {
            errors.add("이메일은 200자 이하여야 합니다");
        }

        if (request.getNameEn() != null && request.getNameEn().length() > 100) {
            errors.add("영문 이름은 100자 이하여야 합니다");
        }

        if (request.getPhone() != null && request.getPhone().length() > 20) {
            errors.add("전화번호는 20자 이하여야 합니다");
        }

        if (request.getMobile() != null && request.getMobile().length() > 20) {
            errors.add("휴대전화번호는 20자 이하여야 합니다");
        }

        return errors;
    }
}
