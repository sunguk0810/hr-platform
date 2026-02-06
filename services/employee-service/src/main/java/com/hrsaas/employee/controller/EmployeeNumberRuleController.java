package com.hrsaas.employee.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.domain.entity.EmployeeNumberRule;
import com.hrsaas.employee.repository.EmployeeNumberRuleRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller for managing employee number generation rules.
 */
@RestController
@RequestMapping("/api/v1/employees/number-rules")
@RequiredArgsConstructor
@Tag(name = "EmployeeNumberRule", description = "사번 규칙 관리 API")
public class EmployeeNumberRuleController {

    private final EmployeeNumberRuleRepository ruleRepository;

    /**
     * Get the active employee number rule for the current tenant.
     */
    @GetMapping
    @Operation(summary = "사번 규칙 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeNumberRule>> getRule() {
        UUID tenantId = TenantContext.getCurrentTenant();
        return ruleRepository.findActiveByTenantId(tenantId)
            .map(rule -> ResponseEntity.ok(ApiResponse.success(rule)))
            .orElse(ResponseEntity.ok(ApiResponse.success(null, "사번 규칙이 설정되지 않았습니다.")));
    }

    /**
     * Create or update the employee number rule for the current tenant.
     */
    @PostMapping
    @Operation(summary = "사번 규칙 생성/수정")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeNumberRule>> createOrUpdate(@RequestBody EmployeeNumberRule rule) {
        UUID tenantId = TenantContext.getCurrentTenant();
        EmployeeNumberRule existing = ruleRepository.findActiveByTenantId(tenantId).orElse(null);

        if (existing != null) {
            existing.setPrefix(rule.getPrefix());
            existing.setIncludeYear(rule.getIncludeYear());
            existing.setYearFormat(rule.getYearFormat());
            existing.setSequenceDigits(rule.getSequenceDigits());
            existing.setSequenceResetPolicy(rule.getSequenceResetPolicy());
            existing.setSeparator(rule.getSeparator());
            existing.setAllowReuse(rule.getAllowReuse());
            return ResponseEntity.ok(ApiResponse.success(ruleRepository.save(existing)));
        }

        rule.setTenantId(tenantId);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(ruleRepository.save(rule)));
    }
}
