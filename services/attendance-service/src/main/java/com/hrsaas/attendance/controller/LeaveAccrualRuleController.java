package com.hrsaas.attendance.controller;

import com.hrsaas.attendance.domain.entity.LeaveAccrualRule;
import com.hrsaas.attendance.repository.LeaveAccrualRuleRepository;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/leaves/accrual-rules")
@RequiredArgsConstructor
@Tag(name = "LeaveAccrualRule", description = "연차 발생 규칙 관리 API")
public class LeaveAccrualRuleController {

    private final LeaveAccrualRuleRepository ruleRepository;

    @GetMapping
    @Operation(summary = "연차 발생 규칙 목록")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<LeaveAccrualRule>>> getAll() {
        UUID tenantId = TenantContext.getCurrentTenant();
        return ResponseEntity.ok(ApiResponse.success(ruleRepository.findActiveByTenantId(tenantId)));
    }

    @PostMapping
    @Operation(summary = "연차 발생 규칙 생성")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<LeaveAccrualRule>> create(@RequestBody LeaveAccrualRule rule) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(ruleRepository.save(rule)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "연차 발생 규칙 수정")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<LeaveAccrualRule>> update(@PathVariable UUID id, @RequestBody LeaveAccrualRule updated) {
        LeaveAccrualRule rule = ruleRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Rule not found: " + id));
        rule.setLeaveTypeCode(updated.getLeaveTypeCode());
        rule.setAccrualType(updated.getAccrualType());
        rule.setBaseEntitlement(updated.getBaseEntitlement());
        rule.setServiceYearBonuses(updated.getServiceYearBonuses());
        rule.setMaxCarryOverDays(updated.getMaxCarryOverDays());
        rule.setCarryOverExpiryMonths(updated.getCarryOverExpiryMonths());
        rule.setIsActive(updated.getIsActive());
        return ResponseEntity.ok(ApiResponse.success(ruleRepository.save(rule)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "연차 발생 규칙 삭제")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        ruleRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "연차 발생 규칙이 삭제되었습니다."));
    }
}
