package com.hrsaas.approval.service;

import com.hrsaas.approval.client.EmployeeClient;
import com.hrsaas.approval.client.OrganizationClient;
import com.hrsaas.approval.domain.entity.ApprovalLine;
import com.hrsaas.approval.domain.entity.ApprovalLineType;
import com.hrsaas.approval.domain.entity.ApprovalTemplate;
import com.hrsaas.approval.domain.entity.ApprovalTemplateLine;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ApprovalLineResolver.
 * Tests the resolution of approval template lines into actual approval lines
 * based on different approver types (SPECIFIC_USER, DEPARTMENT_HEAD, DRAFTER_MANAGER).
 */
@ExtendWith(MockitoExtension.class)
class ApprovalLineResolverTest {

    @Mock
    private OrganizationClient organizationClient;

    @Mock
    private EmployeeClient employeeClient;

    @InjectMocks
    private ApprovalLineResolver approvalLineResolver;

    @Test
    @DisplayName("resolve: SPECIFIC_USER returns ApprovalLine with the specified user ID")
    void resolve_specificUser_returnsUserId() {
        // Given: a template with a SPECIFIC_USER approver line
        UUID approverId = UUID.randomUUID();
        UUID drafterId = UUID.randomUUID();
        UUID drafterDepartmentId = UUID.randomUUID();

        ApprovalTemplateLine templateLine = ApprovalTemplateLine.builder()
            .lineType(ApprovalLineType.SEQUENTIAL)
            .approverType("SPECIFIC_USER")
            .approverId(approverId)
            .approverName("John Doe")
            .build();
        templateLine.setSequence(1);

        ApprovalTemplate template = mock(ApprovalTemplate.class);
        when(template.getTemplateLines()).thenReturn(List.of(templateLine));

        // When
        List<ApprovalLine> result = approvalLineResolver.resolveTemplateLines(template, drafterId, drafterDepartmentId);

        // Then
        assertThat(result).hasSize(1);
        ApprovalLine resolvedLine = result.get(0);
        assertThat(resolvedLine.getApproverId()).isEqualTo(approverId);
        assertThat(resolvedLine.getApproverName()).isEqualTo("John Doe");
        assertThat(resolvedLine.getSequence()).isEqualTo(1);
        assertThat(resolvedLine.getLineType()).isEqualTo(ApprovalLineType.SEQUENTIAL);

        // No external client calls should be made for SPECIFIC_USER
        verifyNoInteractions(organizationClient);
        verifyNoInteractions(employeeClient);
    }

    @Test
    @DisplayName("resolve: DEPARTMENT_HEAD fetches head from OrganizationClient")
    void resolve_departmentHead_fetchesFromOrganizationClient() {
        // Given: a template with a DEPARTMENT_HEAD approver line
        UUID drafterId = UUID.randomUUID();
        UUID drafterDepartmentId = UUID.randomUUID();
        UUID headEmployeeId = UUID.randomUUID();

        ApprovalTemplateLine templateLine = ApprovalTemplateLine.builder()
            .lineType(ApprovalLineType.SEQUENTIAL)
            .approverType("DEPARTMENT_HEAD")
            .build();
        templateLine.setSequence(1);
        // departmentId is null, so it should use drafterDepartmentId

        OrganizationClient.DepartmentHeadResponse headResponse =
            OrganizationClient.DepartmentHeadResponse.builder()
                .employeeId(headEmployeeId)
                .employeeName("Department Head Kim")
                .positionName("Director")
                .departmentName("Engineering")
                .build();

        when(organizationClient.getDepartmentHead(eq(drafterDepartmentId)))
            .thenReturn(headResponse);

        ApprovalTemplate template = mock(ApprovalTemplate.class);
        when(template.getTemplateLines()).thenReturn(List.of(templateLine));

        // When
        List<ApprovalLine> result = approvalLineResolver.resolveTemplateLines(template, drafterId, drafterDepartmentId);

        // Then
        assertThat(result).hasSize(1);
        ApprovalLine resolvedLine = result.get(0);
        assertThat(resolvedLine.getApproverId()).isEqualTo(headEmployeeId);
        assertThat(resolvedLine.getApproverName()).isEqualTo("Department Head Kim");
        assertThat(resolvedLine.getApproverPosition()).isEqualTo("Director");
        assertThat(resolvedLine.getApproverDepartmentName()).isEqualTo("Engineering");
        assertThat(resolvedLine.getSequence()).isEqualTo(1);

        verify(organizationClient).getDepartmentHead(drafterDepartmentId);
        verifyNoInteractions(employeeClient);
    }

    @Test
    @DisplayName("resolve: DRAFTER_MANAGER fetches manager from EmployeeClient")
    void resolve_drafterManager_fetchesFromEmployeeClient() {
        // Given: a template with a DRAFTER_MANAGER approver line
        UUID drafterId = UUID.randomUUID();
        UUID drafterDepartmentId = UUID.randomUUID();
        UUID managerId = UUID.randomUUID();

        ApprovalTemplateLine templateLine = ApprovalTemplateLine.builder()
            .lineType(ApprovalLineType.SEQUENTIAL)
            .approverType("DRAFTER_MANAGER")
            .build();
        templateLine.setSequence(1);

        EmployeeClient.EmployeeResponse managerResponse =
            EmployeeClient.EmployeeResponse.builder()
                .id(managerId)
                .name("Manager Park")
                .positionCode("MGR")
                .departmentName("HR Department")
                .build();

        when(employeeClient.getManager(eq(drafterId)))
            .thenReturn(managerResponse);

        ApprovalTemplate template = mock(ApprovalTemplate.class);
        when(template.getTemplateLines()).thenReturn(List.of(templateLine));

        // When
        List<ApprovalLine> result = approvalLineResolver.resolveTemplateLines(template, drafterId, drafterDepartmentId);

        // Then
        assertThat(result).hasSize(1);
        ApprovalLine resolvedLine = result.get(0);
        assertThat(resolvedLine.getApproverId()).isEqualTo(managerId);
        assertThat(resolvedLine.getApproverName()).isEqualTo("Manager Park");
        assertThat(resolvedLine.getApproverPosition()).isEqualTo("MGR");
        assertThat(resolvedLine.getApproverDepartmentName()).isEqualTo("HR Department");
        assertThat(resolvedLine.getSequence()).isEqualTo(1);

        verify(employeeClient).getManager(drafterId);
        verifyNoInteractions(organizationClient);
    }
}
