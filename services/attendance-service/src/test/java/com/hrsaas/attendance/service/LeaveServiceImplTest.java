package com.hrsaas.attendance.service;

import com.hrsaas.attendance.domain.dto.response.*;
import com.hrsaas.attendance.domain.entity.*;
import com.hrsaas.attendance.repository.LeaveBalanceRepository;
import com.hrsaas.attendance.repository.LeaveRequestRepository;
import com.hrsaas.attendance.service.impl.LeaveServiceImpl;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.ForbiddenException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LeaveServiceImpl Tests")
class LeaveServiceImplTest {

    @Mock
    private LeaveRequestRepository leaveRequestRepository;

    @Mock
    private LeaveBalanceRepository leaveBalanceRepository;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private LeaveServiceImpl leaveService;

    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final UUID ADMIN_ID = UUID.randomUUID();
    private static final UUID EMPLOYEE_ID = UUID.randomUUID();
    private static final UUID DEPARTMENT_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private LeaveRequest createPendingRequest() {
        return LeaveRequest.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT_ID)
                .employeeId(EMPLOYEE_ID)
                .employeeName("테스트직원")
                .departmentId(DEPARTMENT_ID)
                .departmentName("개발팀")
                .leaveType(LeaveType.ANNUAL)
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now().plusDays(6))
                .daysCount(new BigDecimal("2"))
                .reason("개인 사유")
                .status(LeaveStatus.PENDING)
                .build();
    }

    private LeaveBalance createBalance(BigDecimal total, BigDecimal used, BigDecimal pending) {
        return LeaveBalance.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT_ID)
                .employeeId(EMPLOYEE_ID)
                .year(LocalDate.now().getYear())
                .leaveType(LeaveType.ANNUAL)
                .totalDays(total)
                .usedDays(used)
                .pendingDays(pending)
                .carriedOverDays(BigDecimal.ZERO)
                .build();
    }

    @Test
    @DisplayName("getById: owner can access")
    void getById_owner_success() {
        // given
        LeaveRequest request = createPendingRequest();
        when(leaveRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));

        // when
        LeaveRequestResponse response = leaveService.getById(request.getId(), EMPLOYEE_ID, List.of());

        // then
        assertThat(response.getId()).isEqualTo(request.getId());
    }

    @Test
    @DisplayName("getById: admin can access other's request")
    void getById_admin_success() {
        // given
        LeaveRequest request = createPendingRequest();
        when(leaveRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));

        // when
        LeaveRequestResponse response = leaveService.getById(request.getId(), ADMIN_ID, List.of("HR_ADMIN"));

        // then
        assertThat(response.getId()).isEqualTo(request.getId());
    }

    @Test
    @DisplayName("getById: unauthorized user throws exception")
    void getById_unauthorized_throwsException() {
        // given
        LeaveRequest request = createPendingRequest();
        when(leaveRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));
        UUID otherUserId = UUID.randomUUID();

        // when & then
        assertThatThrownBy(() -> leaveService.getById(request.getId(), otherUserId, List.of()))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("본인의 휴가 신청 내역만 조회할 수 있습니다");
    }

    // ===== Phase 2 Tests: Admin APIs =====

    @Test
    @DisplayName("getPendingLeaves: returns paged results with remaining days")
    void getPendingLeaves_returnsPagedWithRemainingDays() {
        // given
        LeaveRequest request = createPendingRequest();
        Page<LeaveRequest> page = new PageImpl<>(List.of(request), PageRequest.of(0, 20), 1);
        when(leaveRequestRepository.findPending(eq(TENANT_ID), any(Pageable.class))).thenReturn(page);

        LeaveBalance balance = createBalance(new BigDecimal("15"), new BigDecimal("3"), new BigDecimal("2"));
        when(leaveBalanceRepository.findByEmployeeIdsAndYear(eq(TENANT_ID), any(java.util.Collection.class), anyInt()))
                .thenReturn(List.of(balance));

        // when
        PageResponse<PendingLeaveResponse> result = leaveService.getPendingLeaves(null, null, PageRequest.of(0, 20));

        // then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getRemainingDays()).isEqualByComparingTo(new BigDecimal("10.0"));
    }

    @Test
    @DisplayName("getPendingSummary: returns correct counts")
    void getPendingSummary_returnsCorrectCounts() {
        // given
        when(leaveRequestRepository.countPending(TENANT_ID)).thenReturn(5L);
        when(leaveRequestRepository.countUrgentPending(eq(TENANT_ID), any(LocalDate.class))).thenReturn(2L);
        when(leaveRequestRepository.countPendingThisWeek(eq(TENANT_ID), any())).thenReturn(3L);

        // when
        PendingLeaveSummaryResponse result = leaveService.getPendingSummary();

        // then
        assertThat(result.getTotalPending()).isEqualTo(5);
        assertThat(result.getUrgentCount()).isEqualTo(2);
        assertThat(result.getThisWeekCount()).isEqualTo(3);
    }

    @Test
    @DisplayName("adminApprove: pending request approves and updates balance")
    void adminApprove_pendingRequest_approvesAndUpdatesBalance() {
        // given
        LeaveRequest request = createPendingRequest();
        LeaveBalance balance = createBalance(new BigDecimal("15"), new BigDecimal("3"), new BigDecimal("2"));

        when(leaveRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));
        when(leaveBalanceRepository.findByEmployeeIdAndYearAndType(
                eq(TENANT_ID), eq(EMPLOYEE_ID), anyInt(), eq(LeaveType.ANNUAL)))
                .thenReturn(Optional.of(balance));
        when(leaveRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // when
        LeaveRequestResponse response = leaveService.adminApprove(request.getId(), "승인합니다", ADMIN_ID);

        // then
        assertThat(response.getStatus()).isEqualTo(LeaveStatus.APPROVED);
        verify(leaveBalanceRepository).save(any(LeaveBalance.class));
    }

    @Test
    @DisplayName("adminApprove: non-pending request throws exception")
    void adminApprove_nonPending_throwsException() {
        // given
        LeaveRequest request = createPendingRequest();
        request.approve(); // make it APPROVED

        when(leaveRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));

        // when & then
        assertThatThrownBy(() -> leaveService.adminApprove(request.getId(), "승인", ADMIN_ID))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("adminReject: pending request rejects and releases balance")
    void adminReject_pendingRequest_rejectsAndReleasesBalance() {
        // given
        LeaveRequest request = createPendingRequest();
        LeaveBalance balance = createBalance(new BigDecimal("15"), new BigDecimal("3"), new BigDecimal("2"));

        when(leaveRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));
        when(leaveBalanceRepository.findByEmployeeIdAndYearAndType(
                eq(TENANT_ID), eq(EMPLOYEE_ID), anyInt(), eq(LeaveType.ANNUAL)))
                .thenReturn(Optional.of(balance));
        when(leaveRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // when
        LeaveRequestResponse response = leaveService.adminReject(request.getId(), "사유 부족", ADMIN_ID);

        // then
        assertThat(response.getStatus()).isEqualTo(LeaveStatus.REJECTED);
        verify(leaveBalanceRepository).save(any(LeaveBalance.class));
    }

    @Test
    @DisplayName("bulkApprove: mixed results returns partial success")
    void bulkApprove_mixedResults_returnsPartialSuccess() {
        // given
        LeaveRequest request1 = createPendingRequest();
        LeaveRequest request2 = createPendingRequest();
        request2.approve(); // already approved - will fail

        LeaveBalance balance = createBalance(new BigDecimal("15"), new BigDecimal("3"), new BigDecimal("2"));

        when(leaveRequestRepository.findAllById(List.of(request1.getId(), request2.getId())))
                .thenReturn(List.of(request1, request2));
        when(leaveBalanceRepository.findByEmployeeIdsAndYear(eq(TENANT_ID), any(java.util.Collection.class), anyInt()))
                .thenReturn(List.of(balance));
        when(leaveRequestRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        // when
        BulkOperationResponse result = leaveService.bulkApprove(
                List.of(request1.getId(), request2.getId()), "일괄 승인", ADMIN_ID);

        // then
        assertThat(result.getSuccessCount()).isEqualTo(1);
        assertThat(result.getFailedCount()).isEqualTo(1);
        assertThat(result.getErrors()).hasSize(1);
    }

    @Test
    @DisplayName("bulkReject: all success returns full count")
    void bulkReject_allSuccess_returnsFullCount() {
        // given
        LeaveRequest request1 = createPendingRequest();
        LeaveRequest request2 = createPendingRequest();
        LeaveBalance balance = createBalance(new BigDecimal("15"), new BigDecimal("3"), new BigDecimal("2"));

        when(leaveRequestRepository.findAllById(List.of(request1.getId(), request2.getId())))
                .thenReturn(List.of(request1, request2));
        when(leaveBalanceRepository.findByEmployeeIdsAndYear(eq(TENANT_ID), any(java.util.Collection.class), anyInt()))
                .thenReturn(List.of(balance));
        when(leaveRequestRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        // when
        BulkOperationResponse result = leaveService.bulkReject(
                List.of(request1.getId(), request2.getId()), "일괄 반려", ADMIN_ID);

        // then
        assertThat(result.getSuccessCount()).isEqualTo(2);
        assertThat(result.getFailedCount()).isEqualTo(0);
    }

    @Test
    @DisplayName("getBalanceByType: returns grouped balances")
    void getBalanceByType_returnsGroupedBalances() {
        // given
        int year = LocalDate.now().getYear();
        LeaveBalance annual = createBalance(new BigDecimal("15"), new BigDecimal("3"), BigDecimal.ZERO);
        LeaveBalance sick = LeaveBalance.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT_ID)
                .employeeId(EMPLOYEE_ID)
                .year(year)
                .leaveType(LeaveType.SICK)
                .totalDays(new BigDecimal("10"))
                .usedDays(BigDecimal.ZERO)
                .pendingDays(BigDecimal.ZERO)
                .carriedOverDays(BigDecimal.ZERO)
                .build();

        when(leaveBalanceRepository.findByEmployeeIdAndYear(TENANT_ID, EMPLOYEE_ID, year))
                .thenReturn(List.of(annual, sick));

        // when
        List<LeaveBalanceResponse> result = leaveService.getBalanceByType(EMPLOYEE_ID, year);

        // then
        assertThat(result).hasSize(2);
    }

    // ===== Phase 3 Tests: Calendar API =====

    @Test
    @DisplayName("getCalendarEvents: with department filters correctly")
    void getCalendarEvents_withDepartment_filtersCorrectly() {
        // given
        LocalDate start = LocalDate.of(2026, 2, 1);
        LocalDate end = LocalDate.of(2026, 2, 28);
        LeaveRequest request = createPendingRequest();

        when(leaveRequestRepository.findCalendarEventsByDepartment(TENANT_ID, DEPARTMENT_ID, start, end))
                .thenReturn(List.of(request));

        // when
        List<LeaveCalendarEventResponse> result = leaveService.getCalendarEvents(start, end, DEPARTMENT_ID);

        // then
        assertThat(result).hasSize(1);
        verify(leaveRequestRepository).findCalendarEventsByDepartment(TENANT_ID, DEPARTMENT_ID, start, end);
        verify(leaveRequestRepository, never()).findCalendarEvents(any(), any(), any());
    }

    @Test
    @DisplayName("getCalendarEvents: without department returns all")
    void getCalendarEvents_noDepartment_returnsAll() {
        // given
        LocalDate start = LocalDate.of(2026, 2, 1);
        LocalDate end = LocalDate.of(2026, 2, 28);
        LeaveRequest request1 = createPendingRequest();
        LeaveRequest request2 = createPendingRequest();

        when(leaveRequestRepository.findCalendarEvents(TENANT_ID, start, end))
                .thenReturn(List.of(request1, request2));

        // when
        List<LeaveCalendarEventResponse> result = leaveService.getCalendarEvents(start, end, null);

        // then
        assertThat(result).hasSize(2);
        verify(leaveRequestRepository).findCalendarEvents(TENANT_ID, start, end);
    }

    @Test
    @DisplayName("getCalendarEvents: empty date range returns empty")
    void getCalendarEvents_dateRange_filtersOverlapping() {
        // given
        LocalDate start = LocalDate.of(2026, 3, 1);
        LocalDate end = LocalDate.of(2026, 3, 31);

        when(leaveRequestRepository.findCalendarEvents(TENANT_ID, start, end))
                .thenReturn(List.of());

        // when
        List<LeaveCalendarEventResponse> result = leaveService.getCalendarEvents(start, end, null);

        // then
        assertThat(result).isEmpty();
    }
}
