package com.hrsaas.organization.service;

import com.hrsaas.organization.client.ApprovalClient;
import com.hrsaas.organization.client.EmployeeClient;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReorgImpactAnalyzer {

    private final EmployeeClient employeeClient;
    private final ApprovalClient approvalClient;

    public ImpactAnalysisResult analyzeImpact(ReorgPlan plan) {
        log.info("Analyzing reorg impact for plan: {}", plan.getTitle());

        ImpactAnalysisResult result = new ImpactAnalysisResult();
        result.setPlanTitle(plan.getTitle());

        List<String> warnings = new ArrayList<>();
        List<String> positionChanges = new ArrayList<>();

        // 1. Employee Impact Analysis
        int totalAffected = analyzeEmployeeImpact(plan, warnings, positionChanges);

        // 2. Approval Impact Analysis
        int totalActiveApprovals = analyzeApprovalImpact(plan, warnings);

        result.setAffectedEmployeeCount(totalAffected);
        result.setPositionChanges(positionChanges);
        result.setApprovalLineChanges(totalActiveApprovals);
        result.setWarnings(warnings);

        return result;
    }

    private int analyzeEmployeeImpact(ReorgPlan plan, List<String> warnings, List<String> positionChanges) {
        int totalAffected = 0;
        if (plan.getChanges() == null || plan.getChanges().isEmpty()) {
            return totalAffected;
        }

        List<UUID> departmentIds = plan.getChanges().stream()
            .map(DepartmentChange::getDepartmentId)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        if (departmentIds.isEmpty()) {
            return totalAffected;
        }

        Map<UUID, Long> employeeCounts = new HashMap<>();
        boolean serviceAvailable = true;

        try {
            Map<UUID, Long> data = employeeClient.countByDepartmentIds(departmentIds).getData();
            if (data != null) {
                employeeCounts.putAll(data);
            }
        } catch (Exception e) {
            log.error("Failed to query employee service", e);
            serviceAvailable = false;
        }

        for (DepartmentChange change : plan.getChanges()) {
            if (change.getDepartmentId() != null) {
                if (!serviceAvailable) {
                    warnings.add("직원 서비스에 연결할 수 없어 부서 " + change.getDepartmentId() + "의 직원 수를 확인할 수 없습니다.");
                    continue;
                }

                Long empCount = employeeCounts.getOrDefault(change.getDepartmentId(), 0L);

                if (empCount > 0) {
                    totalAffected += empCount.intValue();
                    positionChanges.add(change.getAction() + ": " + empCount + " employees affected in department " + change.getDepartmentId());

                    if ("DELETE".equalsIgnoreCase(change.getAction())) {
                        warnings.add("삭제 예정 부서에 " + empCount + "명의 직원이 있습니다: " + change.getDepartmentId());
                    }
                }
            }
        }
        return totalAffected;
    }

    private int analyzeApprovalImpact(ReorgPlan plan, List<String> warnings) {
        int totalActiveApprovals = 0;
        if (plan.getChanges() == null || plan.getChanges().isEmpty()) {
            return totalActiveApprovals;
        }

        List<UUID> departmentIds = plan.getChanges().stream()
            .map(DepartmentChange::getDepartmentId)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        if (departmentIds.isEmpty()) {
            return totalActiveApprovals;
        }

        try {
            Map<UUID, Long> approvalCounts = approvalClient.getDepartmentApprovalCounts(departmentIds).getData();
            if (approvalCounts == null) approvalCounts = Collections.emptyMap();

            for (DepartmentChange change : plan.getChanges()) {
                if (change.getDepartmentId() != null) {
                    Long count = approvalCounts.getOrDefault(change.getDepartmentId(), 0L);
                    if (count > 0) {
                        totalActiveApprovals += count.intValue();
                        if ("DELETE".equalsIgnoreCase(change.getAction())) {
                            warnings.add("삭제 예정 부서에 " + count + "건의 진행 중인 결재가 있습니다: " + change.getDepartmentId());
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to query approval service", e);
            warnings.add("결재 서비스 조회 실패: 활성 결재 건수를 확인할 수 없습니다 - " + e.getMessage());
        }

        return totalActiveApprovals;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReorgPlan {
        private String title;
        private List<DepartmentChange> changes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DepartmentChange {
        private UUID departmentId;
        private String action; // MERGE, SPLIT, MOVE, RENAME, DELETE
        private UUID targetDepartmentId;
        private String newName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImpactAnalysisResult {
        private String planTitle;
        private int affectedEmployeeCount;
        private int approvalLineChanges;
        private List<String> positionChanges;
        private List<String> warnings;
    }
}
