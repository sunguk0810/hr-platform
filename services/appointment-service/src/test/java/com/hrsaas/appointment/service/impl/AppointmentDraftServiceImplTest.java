package com.hrsaas.appointment.service.impl;

import com.hrsaas.appointment.client.ApprovalClient;
import com.hrsaas.appointment.client.EmployeeClient;
import com.hrsaas.appointment.domain.dto.request.*;
import com.hrsaas.appointment.domain.dto.response.AppointmentDraftResponse;
import com.hrsaas.appointment.domain.dto.response.AppointmentSummary;
import com.hrsaas.appointment.domain.entity.*;
import com.hrsaas.appointment.domain.event.AppointmentExecutedEvent;
import com.hrsaas.appointment.repository.*;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.security.UserContext;
import com.hrsaas.common.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentDraftServiceImplTest {

    @Mock
    private AppointmentDraftRepository draftRepository;
    @Mock
    private AppointmentDetailRepository detailRepository;
    @Mock
    private AppointmentHistoryRepository historyRepository;
    @Mock
    private AppointmentScheduleRepository scheduleRepository;
    @Mock
    private EventPublisher eventPublisher;
    @Mock
    private EmployeeClient employeeClient;
    @Mock
    private ApprovalClient approvalClient;

    private AppointmentDraftServiceImpl draftService;

    private UUID tenantId;
    private UUID draftId;
    private AppointmentDraft draft;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        TenantContext.setCurrentTenant(tenantId);

        draftService = new AppointmentDraftServiceImpl(
            draftRepository,
            detailRepository,
            historyRepository,
            scheduleRepository,
            eventPublisher,
            Optional.of(employeeClient),
            approvalClient
        );

        draftId = UUID.randomUUID();
        draft = AppointmentDraft.builder()
                .draftNumber("APT-2025-0001")
                .title("Test Draft")
                .effectiveDate(LocalDate.now().plusDays(1))
                .description("Test Description")
                .build();
        ReflectionTestUtils.setField(draft, "id", draftId);
        ReflectionTestUtils.setField(draft, "tenantId", tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clear();
    }

    @Test
    @DisplayName("Create Draft - Success")
    void create_success() {
        CreateAppointmentDraftRequest request = new CreateAppointmentDraftRequest();
        request.setTitle("New Draft");
        request.setEffectiveDate(LocalDate.now().plusDays(7));
        request.setDescription("Description");
        request.setDetails(Collections.emptyList());

        when(draftRepository.findMaxDraftNumberByPrefix(any(), anyString())).thenReturn(0);
        when(draftRepository.save(any(AppointmentDraft.class))).thenAnswer(invocation -> {
            AppointmentDraft saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
            return saved;
        });

        AppointmentDraftResponse response = draftService.create(request);

        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("New Draft");
        verify(draftRepository).save(any(AppointmentDraft.class));
    }

    @Test
    @DisplayName("Get By ID - Success")
    void getById_success() {
        when(draftRepository.findById(draftId)).thenReturn(Optional.of(draft));

        AppointmentDraftResponse response = draftService.getById(draftId);

        assertThat(response.getId()).isEqualTo(draftId);
    }

    @Test
    @DisplayName("Get By ID - Not Found")
    void getById_notFound() {
        when(draftRepository.findById(draftId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> draftService.getById(draftId))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("발령안을 찾을 수 없습니다");
    }

    @Test
    @DisplayName("Search - Success")
    void search_success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<AppointmentDraft> draftPage = new PageImpl<>(List.of(draft));
        when(draftRepository.findByTenantId(tenantId, pageable)).thenReturn(draftPage);

        Page<AppointmentDraftResponse> result = draftService.search(null, null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getId()).isEqualTo(draftId);
    }

    @Test
    @DisplayName("Update - Success")
    void update_success() {
        UpdateAppointmentDraftRequest request = new UpdateAppointmentDraftRequest();
        request.setTitle("Updated Title");

        when(draftRepository.findById(draftId)).thenReturn(Optional.of(draft));
        when(draftRepository.save(any(AppointmentDraft.class))).thenAnswer(i -> i.getArgument(0));

        AppointmentDraftResponse response = draftService.update(draftId, request);

        assertThat(response.getTitle()).isEqualTo("Updated Title");
    }

    @Test
    @DisplayName("Delete - Success")
    void delete_success() {
        when(draftRepository.findById(draftId)).thenReturn(Optional.of(draft));

        draftService.delete(draftId);

        verify(draftRepository).delete(draft);
    }

    @Test
    @DisplayName("Add Detail - Success")
    void addDetail_success() {
        CreateAppointmentDetailRequest request = new CreateAppointmentDetailRequest();
        request.setEmployeeId(UUID.randomUUID());
        request.setAppointmentType(AppointmentType.PROMOTION);

        when(draftRepository.findById(draftId)).thenReturn(Optional.of(draft));
        when(detailRepository.existsByDraftIdAndEmployeeIdAndAppointmentType(any(), any(), any()))
                .thenReturn(false);
        when(draftRepository.save(any(AppointmentDraft.class))).thenAnswer(i -> i.getArgument(0));

        AppointmentDraftResponse response = draftService.addDetail(draftId, request);

        assertThat(response.getDetails()).hasSize(1);
    }

    @Test
    @DisplayName("Execute - Success")
    void execute_success() {
        ReflectionTestUtils.setField(draft, "status", DraftStatus.APPROVED);
        draft.setEffectiveDate(LocalDate.now());

        when(draftRepository.findById(draftId)).thenReturn(Optional.of(draft));
        when(draftRepository.save(any(AppointmentDraft.class))).thenAnswer(i -> i.getArgument(0));

        AppointmentDraftResponse response = draftService.execute(draftId);

        assertThat(response.getStatus()).isEqualTo(DraftStatus.EXECUTED);
    }

    @Test
    @DisplayName("Execute - With Details")
    void execute_withDetails() {
        ReflectionTestUtils.setField(draft, "status", DraftStatus.APPROVED);
        draft.setEffectiveDate(LocalDate.now());

        AppointmentDetail detail = AppointmentDetail.builder()
                .employeeId(UUID.randomUUID())
                .appointmentType(AppointmentType.PROMOTION)
                .build();
        ReflectionTestUtils.setField(detail, "id", UUID.randomUUID());
        draft.addDetail(detail);

        when(draftRepository.findById(draftId)).thenReturn(Optional.of(draft));
        when(draftRepository.save(any(AppointmentDraft.class))).thenAnswer(i -> i.getArgument(0));

        AppointmentDraftResponse response = draftService.execute(draftId);

        assertThat(response.getStatus()).isEqualTo(DraftStatus.EXECUTED);
        verify(historyRepository).saveAll(anyList());
        verify(eventPublisher).publish(any(AppointmentExecutedEvent.class));
    }

    @Test
    @DisplayName("Submit draft - success")
    void submit_success() {
        // Given
        UUID employeeId = UUID.randomUUID();
        UUID managerId = UUID.randomUUID();
        UUID approvalId = UUID.randomUUID();

        // Security Context
        UserContext userContext = UserContext.builder()
            .tenantId(tenantId)
            .employeeId(employeeId)
            .build();
        SecurityContextHolder.setContext(userContext);

        // Details are required
        AppointmentDetail detail = AppointmentDetail.builder()
            .employeeId(UUID.randomUUID())
            .appointmentType(AppointmentType.PROMOTION)
            .build();
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
        UUID employeeId = UUID.randomUUID();

        UserContext userContext = UserContext.builder()
            .employeeId(employeeId)
            .build();
        SecurityContextHolder.setContext(userContext);

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

    @Test
    @DisplayName("Schedule - Success")
    void schedule_success() {
        ReflectionTestUtils.setField(draft, "status", DraftStatus.APPROVED);

        ScheduleAppointmentRequest request = new ScheduleAppointmentRequest();
        request.setScheduledDate(LocalDate.now().plusDays(1));
        request.setScheduledTime(LocalTime.of(10, 0));

        when(draftRepository.findById(draftId)).thenReturn(Optional.of(draft));
        when(scheduleRepository.existsByDraftIdAndStatusIn(any(), anyList())).thenReturn(false);

        AppointmentDraftResponse response = draftService.schedule(draftId, request);

        verify(scheduleRepository).save(any(AppointmentSchedule.class));
    }

    @Test
    @DisplayName("Cancel - Success")
    void cancel_success() {
        ReflectionTestUtils.setField(draft, "status", DraftStatus.APPROVED);

        CancelAppointmentRequest request = new CancelAppointmentRequest();
        request.setReason("Cancel Reason");

        when(draftRepository.findById(draftId)).thenReturn(Optional.of(draft));
        when(draftRepository.save(any(AppointmentDraft.class))).thenAnswer(i -> i.getArgument(0));

        AppointmentDraftResponse response = draftService.cancel(draftId, request);

        assertThat(response.getStatus()).isEqualTo(DraftStatus.CANCELLED);
        assertThat(response.getCancelReason()).isEqualTo("Cancel Reason");
    }

    @Test
    @DisplayName("Rollback - Success")
    void rollback_success() {
        ReflectionTestUtils.setField(draft, "status", DraftStatus.EXECUTED);

        AppointmentDetail detail = AppointmentDetail.builder()
                .employeeId(UUID.randomUUID())
                .appointmentType(AppointmentType.PROMOTION)
                .build();
        ReflectionTestUtils.setField(detail, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(detail, "status", DetailStatus.EXECUTED);
        draft.addDetail(detail);

        when(draftRepository.findById(draftId)).thenReturn(Optional.of(draft));
        when(draftRepository.save(any(AppointmentDraft.class))).thenAnswer(i -> i.getArgument(0));

        AppointmentDraftResponse response = draftService.rollback(draftId);

        verify(draftRepository).save(draft);
    }

    @Test
    @DisplayName("Get Summary - Success")
    void getSummary_success() {
        List<AppointmentDraftRepository.StatusCount> counts = new ArrayList<>();

        AppointmentDraftRepository.StatusCount count1 = mock(AppointmentDraftRepository.StatusCount.class);
        when(count1.getStatus()).thenReturn(DraftStatus.DRAFT);
        when(count1.getCount()).thenReturn(5L);
        counts.add(count1);

        when(draftRepository.countByStatusGrouped(tenantId)).thenReturn(counts);

        AppointmentSummary summary = draftService.getSummary();

        assertThat(summary.getDraftCount()).isEqualTo(5L);
    }
}
