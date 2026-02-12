package com.hrsaas.appointment.service.impl;

import com.hrsaas.appointment.client.ApprovalClient;
import com.hrsaas.appointment.client.EmployeeClient;
import com.hrsaas.appointment.domain.dto.response.AppointmentDraftResponse;
import com.hrsaas.appointment.domain.entity.AppointmentDetail;
import com.hrsaas.appointment.domain.entity.AppointmentDraft;
import com.hrsaas.appointment.domain.entity.DraftStatus;
import com.hrsaas.appointment.repository.AppointmentDraftRepository;
import com.hrsaas.appointment.repository.AppointmentScheduleRepository;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.security.UserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AppointmentDraftServiceImplTest {

    @InjectMocks
    private AppointmentDraftServiceImpl draftService;

    @Mock
    private AppointmentDraftRepository draftRepository;
    @Mock
    private AppointmentScheduleRepository scheduleRepository;
    @Mock
    private EventPublisher eventPublisher;
    @Mock
    private EmployeeClient employeeClient;
    @Mock
    private ApprovalClient approvalClient;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(draftService, "employeeClient", Optional.of(employeeClient));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clear();
    }

    @Test
    @DisplayName("Submit draft - success")
    void submit_success() {
        // Given
        UUID draftId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();
        UUID employeeId = UUID.randomUUID();
        UUID managerId = UUID.randomUUID();
        UUID approvalId = UUID.randomUUID();

        // Security Context
        UserContext userContext = UserContext.builder()
            .tenantId(tenantId)
            .employeeId(employeeId)
            .build();
        SecurityContextHolder.setContext(userContext);

        // Draft
        AppointmentDraft draft = AppointmentDraft.builder()
            .draftNumber("APT-2023-0001")
            .title("Title")
            .effectiveDate(LocalDate.now())
            .description("Description")
            .build();
        ReflectionTestUtils.setField(draft, "id", draftId);
        ReflectionTestUtils.setField(draft, "tenantId", tenantId);

        AppointmentDetail detail = AppointmentDetail.builder().build();
        draft.addDetail(detail);

        given(draftRepository.findById(draftId)).willReturn(Optional.of(draft));
        given(draftRepository.save(any(AppointmentDraft.class))).willAnswer(invocation -> invocation.getArgument(0));

        // Employee Info
        EmployeeClient.EmployeeResponse drafter = new EmployeeClient.EmployeeResponse(
            employeeId, "EMP001", "Drafter", "email", UUID.randomUUID(), "Dept", "Pos", "PosName", "G1", "Grade", "J1", "Job", managerId
        );
        given(employeeClient.getEmployee(employeeId)).willReturn(ApiResponse.success(drafter));

        // Manager Info
        EmployeeClient.EmployeeResponse manager = new EmployeeClient.EmployeeResponse(
            managerId, "EMP002", "Manager", "email", UUID.randomUUID(), "Dept", "Pos", "PosName", "G1", "Grade", "J1", "Job", null
        );
        given(employeeClient.getEmployee(managerId)).willReturn(ApiResponse.success(manager));

        // Approval Client
        ApprovalClient.ApprovalResponse approvalResponse = new ApprovalClient.ApprovalResponse(approvalId, "DOC-001", "DRAFT");
        given(approvalClient.create(any(ApprovalClient.CreateApprovalRequest.class)))
            .willReturn(ApiResponse.success(approvalResponse));

        // When
        AppointmentDraftResponse response = draftService.submit(draftId);

        // Then
        assertThat(response).isNotNull();
        assertThat(draft.getStatus()).isEqualTo(DraftStatus.PENDING_APPROVAL);
        assertThat(draft.getApprovalId()).isEqualTo(approvalId);

        verify(approvalClient).create(any(ApprovalClient.CreateApprovalRequest.class));
    }

    @Test
    @DisplayName("Submit draft - employee ID not found")
    void submit_noEmployeeId() {
        UUID draftId = UUID.randomUUID();
        AppointmentDraft draft = AppointmentDraft.builder().build();
        ReflectionTestUtils.setField(draft, "id", draftId);
        draft.addDetail(AppointmentDetail.builder().build());

        given(draftRepository.findById(draftId)).willReturn(Optional.of(draft));

        SecurityContextHolder.clear(); // No context

        assertThatThrownBy(() -> draftService.submit(draftId))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("현재 사용자의 직원 정보를 찾을 수 없습니다");
    }

    @Test
    @DisplayName("Submit draft - manager not found")
    void submit_noManager() {
        // Given
        UUID draftId = UUID.randomUUID();
        UUID employeeId = UUID.randomUUID();

        UserContext userContext = UserContext.builder()
            .employeeId(employeeId)
            .build();
        SecurityContextHolder.setContext(userContext);

        AppointmentDraft draft = AppointmentDraft.builder().build();
        ReflectionTestUtils.setField(draft, "id", draftId);
        draft.addDetail(AppointmentDetail.builder().build());

        given(draftRepository.findById(draftId)).willReturn(Optional.of(draft));

        // Drafter has no manager
        EmployeeClient.EmployeeResponse drafter = new EmployeeClient.EmployeeResponse(
            employeeId, "EMP001", "Drafter", "email", UUID.randomUUID(), "Dept", "Pos", "PosName", "G1", "Grade", "J1", "Job", null
        );
        given(employeeClient.getEmployee(employeeId)).willReturn(ApiResponse.success(drafter));

        // When/Then
        assertThatThrownBy(() -> draftService.submit(draftId))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("승인자(매니저)를 찾을 수 없습니다");
    }
}
