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

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
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

    @PutMapping
    @Operation(summary = "사번 규칙 수정")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeNumberRule>> update(@RequestBody EmployeeNumberRule rule) {
        return createOrUpdate(rule);
    }

    @GetMapping("/preview")
    @Operation(summary = "사번 규칙 미리보기")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> preview() {
        UUID tenantId = TenantContext.getCurrentTenant();
        EmployeeNumberRule rule = ruleRepository.findActiveByTenantId(tenantId).orElse(null);

        int year = LocalDate.now().getYear();
        int sequenceDigits = 4;
        String nextNumber;
        String formatDescription;
        int currentSequence;

        if (rule == null) {
            currentSequence = 0;
            nextNumber = year + "-" + String.format("%04d", 1);
            formatDescription = "YYYY + 4자리 순번";
        } else {
            String prefix = rule.getPrefix() != null ? rule.getPrefix() : "";
            boolean includeYear = Boolean.TRUE.equals(rule.getIncludeYear());
            String separator = rule.getSeparator() != null ? rule.getSeparator() : "";
            sequenceDigits = rule.getSequenceDigits() != null ? rule.getSequenceDigits() : 4;
            currentSequence = rule.getCurrentSequence() != null ? rule.getCurrentSequence() : 0;
            int nextSequence = currentSequence + 1;

            StringBuilder sb = new StringBuilder();
            if (!prefix.isBlank()) {
                sb.append(prefix);
            }
            if (includeYear) {
                if (sb.length() > 0 && !separator.isEmpty()) {
                    sb.append(separator);
                }
                String yearValue = "YY".equals(rule.getYearFormat()) ? String.valueOf(year % 100) : String.valueOf(year);
                sb.append(yearValue);
            }
            if (sb.length() > 0 && !separator.isEmpty()) {
                sb.append(separator);
            }
            sb.append(String.format("%0" + sequenceDigits + "d", nextSequence));

            nextNumber = sb.toString();
            formatDescription = (prefix.isBlank() ? "" : "PREFIX + ")
                + (includeYear ? "YEAR + " : "")
                + sequenceDigits + "자리 순번";
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("nextNumber", nextNumber);
        payload.put("currentSequence", currentSequence);
        payload.put("formatDescription", formatDescription);
        payload.put("rule", rule);

        return ResponseEntity.ok(ApiResponse.success(payload));
    }
}
