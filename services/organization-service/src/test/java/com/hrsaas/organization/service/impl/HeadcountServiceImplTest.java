package com.hrsaas.organization.service.impl;

import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.core.exception.ValidationException;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.security.UserContext;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.organization.TestEntityFactory;
import com.hrsaas.organization.client.ApprovalClient;
import com.hrsaas.organization.client.dto.ApprovalResponse;
import com.hrsaas.organization.client.dto.CreateApprovalRequest;
import com.hrsaas.organization.domain.dto.request.CreateHeadcountPlanRequest;
import com.hrsaas.organization.domain.dto.request.CreateHeadcountRequestRequest;
import com.hrsaas.organization.domain.dto.request.UpdateHeadcountPlanRequest;
import com.hrsaas.organization.domain.dto.response.HeadcountPlanResponse;
import com.hrsaas.organization.domain.dto.response.HeadcountRequestResponse;
import com.hrsaas.organization.domain.dto.response.HeadcountSummaryResponse;
import com.hrsaas.organization.domain.entity.HeadcountHistory;
import com.hrsaas.organization.domain.entity.HeadcountPlan;
import com.hrsaas.organization.domain.entity.HeadcountRequest;
import com.hrsaas.organization.domain.entity.HeadcountRequestStatus;
import com.hrsaas.organization.domain.entity.HeadcountRequestType;
import com.hrsaas.organization.repository.HeadcountHistoryRepository;
import com.hrsaas.organization.repository.HeadcountPlanRepository;
import com.hrsaas.organization.repository.HeadcountRequestRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
class HeadcountServiceImplTest {

    @Mock
    private HeadcountPlanRepository headcountPlanRepository;

    @Mock
    private HeadcountRequestRepository headcountRequestRepository;

    @Mock
    private HeadcountHistoryRepository headcountHistoryRepository;

    @Mock
    private ApprovalClient approvalClient;

    @InjectMocks
    private HeadcountServiceImpl headcountService;

    @Captor
    private ArgumentCaptor<HeadcountHistory> historyCaptor;

    @Captor
    private ArgumentCaptor<HeadcountPlan> planCaptor;

    @Captor
    private ArgumentCaptor<HeadcountRequest> requestCaptor;

    private UUID tenantId;
    private UUID departmentId;
    private UUID planId;
    private UUID requestId;
    private UUID userId;
    private HeadcountPlan plan;
    private HeadcountRequest headcountRequest;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        departmentId = UUID.randomUUID();
        planId = UUID.randomUUID();
        requestId = UUID.randomUUID();
        userId = UUID.randomUUID();

        TenantContext.setCurrentTenant(tenantId);
        SecurityContextHolder.setContext(UserContext.builder()
            .userId(userId)
            .tenantId(tenantId)
            .username("테스터")
            .build());

        plan = TestEntityFactory.createHeadcountPlan(planId, 2026, departmentId, "개발팀");
        headcountRequest = TestEntityFactory.createHeadcountRequest(requestId, departmentId, "개발팀");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clear();
    }

    // --- Plan operations ---

    @Test
    @DisplayName("createPlan: 정상적으로 정현원 계획을 생성한다")
    void createPlan_success_returnsPlanResponse() {
        // given
        CreateHeadcountPlanRequest request = CreateHeadcountPlanRequest.builder()
            .year(2026)
            .departmentId(departmentId)
            .departmentName("개발팀")
            .plannedCount(10)
            .currentCount(8)
            .notes("2026 정원 계획")
            .build();

        when(headcountPlanRepository.existsByTenantIdAndYearAndDepartmentId(
            eq(tenantId), eq(2026), eq(departmentId))).thenReturn(false);
        when(headcountPlanRepository.save(any(HeadcountPlan.class))).thenAnswer(invocation -> {
            HeadcountPlan p = invocation.getArgument(0);
            TestEntityFactory.setEntityId(p, planId);
            return p;
        });
        when(headcountHistoryRepository.save(any(HeadcountHistory.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // when
        HeadcountPlanResponse response = headcountService.createPlan(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getYear()).isEqualTo(2026);
        assertThat(response.getDepartmentId()).isEqualTo(departmentId);
        assertThat(response.getDepartmentName()).isEqualTo("개발팀");
        assertThat(response.getPlannedCount()).isEqualTo(10);
        assertThat(response.getCurrentCount()).isEqualTo(8);

        verify(headcountPlanRepository).save(any(HeadcountPlan.class));
    }

    @Test
    @DisplayName("createPlan: 중복 계획이면 DuplicateException을 던진다")
    void createPlan_duplicate_throwsDuplicateException() {
        // given
        CreateHeadcountPlanRequest request = CreateHeadcountPlanRequest.builder()
            .year(2026)
            .departmentId(departmentId)
            .departmentName("개발팀")
            .plannedCount(10)
            .build();

        when(headcountPlanRepository.existsByTenantIdAndYearAndDepartmentId(
            eq(tenantId), eq(2026), eq(departmentId))).thenReturn(true);

        // when & then
        assertThatThrownBy(() -> headcountService.createPlan(request))
            .isInstanceOf(DuplicateException.class)
            .hasMessageContaining("이미 존재합니다");

        verify(headcountPlanRepository, never()).save(any());
    }

    @Test
    @DisplayName("createPlan: G13 - 정원 이력이 기록된다")
    void createPlan_success_recordsHistory() {
        // given
        CreateHeadcountPlanRequest request = CreateHeadcountPlanRequest.builder()
            .year(2026)
            .departmentId(departmentId)
            .departmentName("개발팀")
            .plannedCount(10)
            .currentCount(8)
            .build();

        when(headcountPlanRepository.existsByTenantIdAndYearAndDepartmentId(
            eq(tenantId), eq(2026), eq(departmentId))).thenReturn(false);
        when(headcountPlanRepository.save(any(HeadcountPlan.class))).thenAnswer(invocation -> {
            HeadcountPlan p = invocation.getArgument(0);
            TestEntityFactory.setEntityId(p, planId);
            return p;
        });
        when(headcountHistoryRepository.save(any(HeadcountHistory.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // when
        headcountService.createPlan(request);

        // then
        verify(headcountHistoryRepository).save(historyCaptor.capture());
        HeadcountHistory history = historyCaptor.getValue();
        assertThat(history.getPlanId()).isEqualTo(planId);
        assertThat(history.getEventType()).isEqualTo("PLAN_CREATED");
        assertThat(history.getTenantId()).isEqualTo(tenantId);
        assertThat(history.getActorId()).isEqualTo(userId);
    }

    @Test
    @DisplayName("getPlanById: 존재하는 계획을 조회한다")
    void getPlanById_exists_returnsResponse() {
        // given
        when(headcountPlanRepository.findByIdAndTenantId(eq(planId), eq(tenantId)))
            .thenReturn(Optional.of(plan));

        // when
        HeadcountPlanResponse response = headcountService.getPlanById(planId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(planId);
        assertThat(response.getYear()).isEqualTo(2026);
        assertThat(response.getDepartmentName()).isEqualTo("개발팀");

        verify(headcountPlanRepository).findByIdAndTenantId(planId, tenantId);
    }

    @Test
    @DisplayName("updatePlan: 정상적으로 정현원 계획을 수정하고 이력을 기록한다")
    void updatePlan_success_returnsResponse() {
        // given
        UpdateHeadcountPlanRequest request = UpdateHeadcountPlanRequest.builder()
            .plannedCount(15)
            .notes("수정된 계획")
            .build();

        when(headcountPlanRepository.findByIdAndTenantId(eq(planId), eq(tenantId)))
            .thenReturn(Optional.of(plan));
        when(headcountPlanRepository.save(any(HeadcountPlan.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(headcountHistoryRepository.save(any(HeadcountHistory.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // when
        HeadcountPlanResponse response = headcountService.updatePlan(planId, request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getPlannedCount()).isEqualTo(15);

        verify(headcountPlanRepository).save(any(HeadcountPlan.class));
        verify(headcountHistoryRepository).save(historyCaptor.capture());
        HeadcountHistory history = historyCaptor.getValue();
        assertThat(history.getEventType()).isEqualTo("PLAN_UPDATED");
        assertThat(history.getPreviousValue()).contains("10");
        assertThat(history.getNewValue()).contains("15");
    }

    // --- Request operations ---

    @Test
    @DisplayName("createRequest: 정상적으로 정현원 변경 요청을 생성한다")
    void createRequest_success_returnsResponse() {
        // given
        CreateHeadcountRequestRequest request = CreateHeadcountRequestRequest.builder()
            .departmentId(departmentId)
            .departmentName("개발팀")
            .type(HeadcountRequestType.INCREASE)
            .requestCount(3)
            .reason("신규 프로젝트")
            .effectiveDate(LocalDate.of(2026, 4, 1))
            .build();

        when(headcountRequestRepository.save(any(HeadcountRequest.class))).thenAnswer(invocation -> {
            HeadcountRequest req = invocation.getArgument(0);
            TestEntityFactory.setEntityId(req, requestId);
            return req;
        });

        // when
        HeadcountRequestResponse response = headcountService.createRequest(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getDepartmentId()).isEqualTo(departmentId);
        assertThat(response.getType()).isEqualTo(HeadcountRequestType.INCREASE);
        assertThat(response.getRequestCount()).isEqualTo(3);
        assertThat(response.getStatus()).isEqualTo(HeadcountRequestStatus.DRAFT);

        verify(headcountRequestRepository).save(any(HeadcountRequest.class));
    }

    @Test
    @DisplayName("submitRequest: G03 - 초안 요청을 제출하면 결재 연동이 수행된다")
    void submitRequest_draft_success() {
        // given
        when(headcountRequestRepository.findByIdAndTenantId(eq(requestId), eq(tenantId)))
            .thenReturn(Optional.of(headcountRequest));

        UUID approvalId = UUID.randomUUID();
        ApprovalResponse approvalResponse = new ApprovalResponse(approvalId, "PENDING");
        when(approvalClient.createApproval(any(CreateApprovalRequest.class)))
            .thenReturn(ApiResponse.success(approvalResponse));
        when(headcountRequestRepository.save(any(HeadcountRequest.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // when
        headcountService.submitRequest(requestId);

        // then
        verify(approvalClient).createApproval(any(CreateApprovalRequest.class));
        verify(headcountRequestRepository).save(requestCaptor.capture());

        HeadcountRequest savedRequest = requestCaptor.getValue();
        assertThat(savedRequest.getStatus()).isEqualTo(HeadcountRequestStatus.PENDING);
        assertThat(savedRequest.getApprovalId()).isEqualTo(approvalId);
    }

    @Test
    @DisplayName("submitRequest: 초안이 아닌 요청을 제출하면 ValidationException을 던진다")
    void submitRequest_notDraft_throwsValidationException() {
        // given
        headcountRequest.submit(); // PENDING 상태로 변경
        when(headcountRequestRepository.findByIdAndTenantId(eq(requestId), eq(tenantId)))
            .thenReturn(Optional.of(headcountRequest));

        // when & then
        assertThatThrownBy(() -> headcountService.submitRequest(requestId))
            .isInstanceOf(ValidationException.class)
            .hasMessageContaining("초안 상태");

        verify(approvalClient, never()).createApproval(any());
    }

    @Test
    @DisplayName("approveRequest: 대기 상태 요청을 승인하면 정원 계획이 갱신된다")
    void approveRequest_pending_updatesStatusAndPlan() {
        // given
        headcountRequest.submit(); // PENDING 상태로 변경
        when(headcountRequestRepository.findByIdAndTenantId(eq(requestId), eq(tenantId)))
            .thenReturn(Optional.of(headcountRequest));

        int currentYear = LocalDate.now().getYear();
        HeadcountPlan relatedPlan = TestEntityFactory.createHeadcountPlan(
            UUID.randomUUID(), currentYear, departmentId, "개발팀");
        int originalApprovedCount = relatedPlan.getApprovedCount();

        when(headcountPlanRepository.findByTenantIdAndYearAndDepartmentId(
            eq(tenantId), eq(currentYear), eq(departmentId)))
            .thenReturn(Optional.of(relatedPlan));
        when(headcountPlanRepository.save(any(HeadcountPlan.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(headcountRequestRepository.save(any(HeadcountRequest.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // when
        HeadcountRequestResponse response = headcountService.approveRequest(requestId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(HeadcountRequestStatus.APPROVED);

        // Plan의 approvedCount가 요청의 requestCount(2)만큼 증가했는지 확인
        verify(headcountPlanRepository).save(planCaptor.capture());
        HeadcountPlan savedPlan = planCaptor.getValue();
        assertThat(savedPlan.getApprovedCount())
            .isEqualTo(originalApprovedCount + headcountRequest.getRequestCount());
    }

    @Test
    @DisplayName("rejectRequest: 대기 상태 요청을 반려하면 상태가 REJECTED로 변경된다")
    void rejectRequest_pending_updatesStatus() {
        // given
        headcountRequest.submit(); // PENDING 상태로 변경
        when(headcountRequestRepository.findByIdAndTenantId(eq(requestId), eq(tenantId)))
            .thenReturn(Optional.of(headcountRequest));
        when(headcountRequestRepository.save(any(HeadcountRequest.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // when
        HeadcountRequestResponse response = headcountService.rejectRequest(requestId, "예산 부족");

        // then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(HeadcountRequestStatus.REJECTED);

        verify(headcountRequestRepository).save(requestCaptor.capture());
        assertThat(requestCaptor.getValue().getStatus()).isEqualTo(HeadcountRequestStatus.REJECTED);
    }

    @Test
    @DisplayName("getSummary: 연도별 정현원 요약 데이터를 집계하여 반환한다")
    void getSummary_returnsAggregatedData() {
        // given
        UUID dept1Id = UUID.randomUUID();
        UUID dept2Id = UUID.randomUUID();

        HeadcountPlan plan1 = TestEntityFactory.createHeadcountPlan(UUID.randomUUID(), 2026, dept1Id, "개발팀");
        HeadcountPlan plan2 = TestEntityFactory.createHeadcountPlan(UUID.randomUUID(), 2026, dept2Id, "기획팀");

        // plan1: planned=10, current=8, approved=0 (default from factory)
        // plan2: planned=10, current=8, approved=0 (default from factory)
        plan2.incrementApprovedCount(3);

        when(headcountPlanRepository.findByTenantIdAndYear(eq(tenantId), eq(2026)))
            .thenReturn(List.of(plan1, plan2));

        // when
        HeadcountSummaryResponse response = headcountService.getSummary(2026);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getYear()).isEqualTo(2026);
        assertThat(response.getTotalPlannedCount()).isEqualTo(20);   // 10 + 10
        assertThat(response.getTotalCurrentCount()).isEqualTo(16);   // 8 + 8
        assertThat(response.getTotalApprovedCount()).isEqualTo(3);   // 0 + 3
        assertThat(response.getTotalVariance()).isEqualTo(4);        // 20 - 16
        assertThat(response.getDepartments()).hasSize(2);

        HeadcountSummaryResponse.DepartmentSummary dept2Summary = response.getDepartments().stream()
            .filter(d -> d.getDepartmentId().equals(dept2Id))
            .findFirst()
            .orElseThrow();
        assertThat(dept2Summary.getApprovedCount()).isEqualTo(3);
        assertThat(dept2Summary.getAvailableCount()).isEqualTo(7);   // 10 - 3
    }
}
