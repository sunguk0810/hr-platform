package com.hrsaas.organization.service;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.organization.client.EmployeeClient;
import com.hrsaas.organization.service.ReorgImpactAnalyzer.DepartmentChange;
import com.hrsaas.organization.service.ReorgImpactAnalyzer.ImpactAnalysisResult;
import com.hrsaas.organization.service.ReorgImpactAnalyzer.ReorgPlan;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReorgImpactAnalyzerTest {

    @Mock
    private EmployeeClient employeeClient;

    @InjectMocks
    private ReorgImpactAnalyzer reorgImpactAnalyzer;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        TenantContext.setCurrentTenant(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("analyzeImpact: 변경사항이 있으면 영향 직원 수를 집계하여 반환한다")
    void analyzeImpact_withChanges_returnsEmployeeCounts() {
        // given
        UUID dept1Id = UUID.randomUUID();
        UUID dept2Id = UUID.randomUUID();

        DepartmentChange change1 = new DepartmentChange(dept1Id, "MERGE", null, null);
        DepartmentChange change2 = new DepartmentChange(dept2Id, "MOVE", null, "이동팀");

        ReorgPlan plan = new ReorgPlan("2026 조직개편", List.of(change1, change2));

        when(employeeClient.countByDepartmentId(eq(dept1Id)))
            .thenReturn(ApiResponse.success(5L));
        when(employeeClient.countByDepartmentId(eq(dept2Id)))
            .thenReturn(ApiResponse.success(3L));

        // when
        ImpactAnalysisResult result = reorgImpactAnalyzer.analyzeImpact(plan);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getPlanTitle()).isEqualTo("2026 조직개편");
        assertThat(result.getAffectedEmployeeCount()).isEqualTo(8); // 5 + 3
        assertThat(result.getPositionChanges()).hasSize(2);
        assertThat(result.getWarnings()).isEmpty();
        assertThat(result.getApprovalLineChanges()).isEqualTo(0);
    }

    @Test
    @DisplayName("analyzeImpact: 직원이 있는 부서 삭제 시 경고를 추가한다")
    void analyzeImpact_deleteWithEmployees_addsWarning() {
        // given
        UUID deptId = UUID.randomUUID();

        DepartmentChange deleteChange = new DepartmentChange(deptId, "DELETE", null, null);

        ReorgPlan plan = new ReorgPlan("부서 삭제 계획", List.of(deleteChange));

        when(employeeClient.countByDepartmentId(eq(deptId)))
            .thenReturn(ApiResponse.success(10L));

        // when
        ImpactAnalysisResult result = reorgImpactAnalyzer.analyzeImpact(plan);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getAffectedEmployeeCount()).isEqualTo(10);
        assertThat(result.getWarnings()).hasSize(1);
        assertThat(result.getWarnings().get(0)).contains("삭제 예정 부서에");
        assertThat(result.getWarnings().get(0)).contains("10명");
        assertThat(result.getWarnings().get(0)).contains(deptId.toString());
    }

    @Test
    @DisplayName("analyzeImpact: 직원 서비스 장애 시 fallback(-1) 응답이면 경고를 추가한다")
    void analyzeImpact_employeeServiceDown_addsWarning() {
        // given
        UUID deptId = UUID.randomUUID();

        DepartmentChange change = new DepartmentChange(deptId, "MOVE", null, "이동팀");

        ReorgPlan plan = new ReorgPlan("서비스 장애 테스트", List.of(change));

        // Fallback returns -1 when employee-service is unavailable
        when(employeeClient.countByDepartmentId(eq(deptId)))
            .thenReturn(ApiResponse.success(-1L));

        // when
        ImpactAnalysisResult result = reorgImpactAnalyzer.analyzeImpact(plan);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getAffectedEmployeeCount()).isEqualTo(0);
        assertThat(result.getWarnings()).hasSize(1);
        assertThat(result.getWarnings().get(0)).contains("직원 서비스에 연결할 수 없어");
        assertThat(result.getWarnings().get(0)).contains(deptId.toString());
        assertThat(result.getPositionChanges()).isEmpty();
    }
}
