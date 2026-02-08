package com.hrsaas.organization.service;

import com.hrsaas.organization.client.EmployeeClient;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReorgImpactAnalyzer {

    private final EmployeeClient employeeClient;

    public ImpactAnalysisResult analyzeImpact(ReorgPlan plan) {
        log.info("Analyzing reorg impact for plan: {}", plan.getTitle());

        ImpactAnalysisResult result = new ImpactAnalysisResult();
        result.setPlanTitle(plan.getTitle());

        int totalAffected = 0;
        List<String> warnings = new ArrayList<>();
        List<String> positionChanges = new ArrayList<>();

        if (plan.getChanges() != null) {
            for (DepartmentChange change : plan.getChanges()) {
                if (change.getDepartmentId() != null) {
                    try {
                        Long empCount = employeeClient.countByDepartmentId(change.getDepartmentId()).getData();
                        if (empCount != null && empCount > 0) {
                            totalAffected += empCount.intValue();
                            positionChanges.add(change.getAction() + ": " + empCount + " employees affected in department " + change.getDepartmentId());

                            if ("DELETE".equalsIgnoreCase(change.getAction()) && empCount > 0) {
                                warnings.add("삭제 예정 부서에 " + empCount + "명의 직원이 있습니다: " + change.getDepartmentId());
                            }
                        } else if (empCount != null && empCount < 0) {
                            warnings.add("직원 서비스에 연결할 수 없어 부서 " + change.getDepartmentId() + "의 직원 수를 확인할 수 없습니다.");
                        }
                    } catch (Exception e) {
                        warnings.add("직원 수 조회 실패: " + change.getDepartmentId() + " - " + e.getMessage());
                    }
                }
            }
        }

        // TODO: Query approval-service for active approval lines
        result.setApprovalLineChanges(0);

        result.setAffectedEmployeeCount(totalAffected);
        result.setPositionChanges(positionChanges);
        result.setWarnings(warnings);

        return result;
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
