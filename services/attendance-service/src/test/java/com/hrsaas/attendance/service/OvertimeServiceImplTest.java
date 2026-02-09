package com.hrsaas.attendance.service;

import com.hrsaas.attendance.domain.dto.request.CreateOvertimeRequest;
import com.hrsaas.attendance.domain.dto.response.OvertimeRequestResponse;
import com.hrsaas.attendance.domain.entity.OvertimeRequest;
import com.hrsaas.attendance.domain.entity.OvertimeStatus;
import com.hrsaas.attendance.domain.event.OvertimeRequestCreatedEvent;
import com.hrsaas.attendance.repository.OvertimeRequestRepository;
import com.hrsaas.attendance.service.impl.OvertimeServiceImpl;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OvertimeServiceImpl Tests")
class OvertimeServiceImplTest {

    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final UUID EMPLOYEE_ID = UUID.randomUUID();
    private static final UUID DEPARTMENT_ID = UUID.randomUUID();

    @Mock
    private OvertimeRequestRepository overtimeRequestRepository;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private OvertimeServiceImpl overtimeService;

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private CreateOvertimeRequest createRequest() {
        return CreateOvertimeRequest.builder()
            .overtimeDate(LocalDate.of(2026, 2, 10))
            .startTime(LocalTime.of(18, 0))
            .endTime(LocalTime.of(21, 0))
            .plannedHours(new BigDecimal("3.00"))
            .reason("프로젝트 마감")
            .build();
    }

    private OvertimeRequest buildOvertimeRequest() {
        return OvertimeRequest.builder()
            .employeeId(EMPLOYEE_ID)
            .employeeName("홍길동")
            .departmentId(DEPARTMENT_ID)
            .departmentName("개발팀")
            .overtimeDate(LocalDate.of(2026, 2, 10))
            .startTime(LocalTime.of(18, 0))
            .endTime(LocalTime.of(21, 0))
            .plannedHours(new BigDecimal("3.00"))
            .reason("프로젝트 마감")
            .build();
    }

    @Test
    @DisplayName("create: publishes OvertimeRequestCreatedEvent")
    void create_publishesOvertimeRequestCreatedEvent() {
        // given
        CreateOvertimeRequest request = createRequest();
        OvertimeRequest saved = buildOvertimeRequest();
        when(overtimeRequestRepository.save(any())).thenReturn(saved);

        // when
        OvertimeRequestResponse response = overtimeService.create(
            EMPLOYEE_ID, "홍길동", DEPARTMENT_ID, "개발팀", request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(OvertimeStatus.PENDING);

        ArgumentCaptor<OvertimeRequestCreatedEvent> eventCaptor = ArgumentCaptor.forClass(OvertimeRequestCreatedEvent.class);
        verify(eventPublisher).publish(eventCaptor.capture());

        OvertimeRequestCreatedEvent event = eventCaptor.getValue();
        assertThat(event.getEmployeeId()).isEqualTo(EMPLOYEE_ID);
        assertThat(event.getDepartmentId()).isEqualTo(DEPARTMENT_ID);
        assertThat(event.getPlannedHours()).isEqualByComparingTo(new BigDecimal("3.00"));
        assertThat(event.getReason()).isEqualTo("프로젝트 마감");
    }

    @Test
    @DisplayName("approve: PENDING request is approved")
    void approve_pendingRequest_approvesSuccessfully() {
        // given
        UUID requestId = UUID.randomUUID();
        OvertimeRequest request = buildOvertimeRequest();
        when(overtimeRequestRepository.findById(requestId)).thenReturn(Optional.of(request));
        when(overtimeRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // when
        OvertimeRequestResponse response = overtimeService.approve(requestId);

        // then
        assertThat(response.getStatus()).isEqualTo(OvertimeStatus.APPROVED);
    }

    @Test
    @DisplayName("reject: PENDING request is rejected with reason")
    void reject_pendingRequest_rejectsWithReason() {
        // given
        UUID requestId = UUID.randomUUID();
        OvertimeRequest request = buildOvertimeRequest();
        when(overtimeRequestRepository.findById(requestId)).thenReturn(Optional.of(request));
        when(overtimeRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // when
        OvertimeRequestResponse response = overtimeService.reject(requestId, "업무 필요성 부족");

        // then
        assertThat(response.getStatus()).isEqualTo(OvertimeStatus.REJECTED);
        assertThat(response.getRejectionReason()).isEqualTo("업무 필요성 부족");
    }

    @Test
    @DisplayName("approve: non-existent request throws NotFoundException")
    void approve_notFound_throwsException() {
        // given
        UUID requestId = UUID.randomUUID();
        when(overtimeRequestRepository.findById(requestId)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> overtimeService.approve(requestId))
            .isInstanceOf(NotFoundException.class);
    }
}
