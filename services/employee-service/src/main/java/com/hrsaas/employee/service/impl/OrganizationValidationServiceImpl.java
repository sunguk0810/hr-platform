package com.hrsaas.employee.service.impl;

import com.hrsaas.common.core.exception.ValidationException;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.client.OrganizationServiceClient;
import com.hrsaas.employee.service.OrganizationValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrganizationValidationServiceImpl implements OrganizationValidationService {

    private final OrganizationServiceClient organizationServiceClient;

    @Override
    public void validateDepartment(UUID departmentId) {
        if (departmentId == null) return;

        try {
            UUID tenantId = TenantContext.getCurrentTenant();
            var response = organizationServiceClient.getDepartments(tenantId.toString());
            if (response != null && response.getData() != null) {
                boolean found = response.getData().stream()
                    .anyMatch(d -> departmentId.equals(d.getId()));
                if (!found) {
                    throw new ValidationException("EMP_031", "유효하지 않은 부서입니다: " + departmentId);
                }
            }
        } catch (ValidationException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Organization service unavailable for department validation: departmentId={}", departmentId, e);
            // Best-effort: allow if org service is down
        }
    }

    @Override
    public void validatePosition(String positionCode) {
        if (positionCode == null || positionCode.isBlank()) return;

        try {
            UUID tenantId = TenantContext.getCurrentTenant();
            var response = organizationServiceClient.getPositions(tenantId.toString());
            if (response != null && response.getData() != null) {
                boolean found = response.getData().stream()
                    .anyMatch(p -> positionCode.equals(p.getCode()));
                if (!found) {
                    throw new ValidationException("EMP_032", "유효하지 않은 직위입니다: " + positionCode);
                }
            }
        } catch (ValidationException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Organization service unavailable for position validation: positionCode={}", positionCode, e);
        }
    }

    @Override
    public void validateGrade(String jobTitleCode) {
        if (jobTitleCode == null || jobTitleCode.isBlank()) return;

        try {
            UUID tenantId = TenantContext.getCurrentTenant();
            var response = organizationServiceClient.getGrades(tenantId.toString());
            if (response != null && response.getData() != null) {
                boolean found = response.getData().stream()
                    .anyMatch(g -> jobTitleCode.equals(g.getCode()));
                if (!found) {
                    throw new ValidationException("EMP_033", "유효하지 않은 직급입니다: " + jobTitleCode);
                }
            }
        } catch (ValidationException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Organization service unavailable for grade validation: jobTitleCode={}", jobTitleCode, e);
        }
    }
}
