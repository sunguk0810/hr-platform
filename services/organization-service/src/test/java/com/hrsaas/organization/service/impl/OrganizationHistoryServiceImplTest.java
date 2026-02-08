package com.hrsaas.organization.service.impl;

import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.security.UserContext;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.organization.domain.dto.response.DepartmentHistoryResponse;
import com.hrsaas.organization.domain.entity.OrganizationHistory;
import com.hrsaas.organization.domain.event.DepartmentCreatedEvent;
import com.hrsaas.organization.domain.event.DepartmentMergedEvent;
import com.hrsaas.organization.repository.OrganizationHistoryRepository;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrganizationHistoryServiceImplTest {

    @Mock
    private OrganizationHistoryRepository organizationHistoryRepository;

    @InjectMocks
    private OrganizationHistoryServiceImpl organizationHistoryService;

    @Captor
    private ArgumentCaptor<OrganizationHistory> historyCaptor;

    private UUID tenantId;
    private UUID userId;
    private UUID departmentId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        userId = UUID.randomUUID();
        departmentId = UUID.randomUUID();

        TenantContext.setCurrentTenant(tenantId);
        SecurityContextHolder.setContext(UserContext.builder()
            .userId(userId)
            .tenantId(tenantId)
            .username("관리자")
            .build());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clear();
    }

    @Test
    @DisplayName("recordEvent: 조직 변경 이력을 저장한다")
    void recordEvent_success_savesHistory() {
        // given
        when(organizationHistoryRepository.save(any(OrganizationHistory.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // when
        organizationHistoryService.recordEvent(
            "DEPARTMENT_CREATED",
            departmentId,
            "개발팀",
            "개발팀 부서 생성",
            "개발팀 부서가 생성되었습니다.",
            null,
            "{\"code\":\"DEV01\",\"level\":2}",
            null
        );

        // then
        verify(organizationHistoryRepository).save(historyCaptor.capture());
        OrganizationHistory saved = historyCaptor.getValue();
        assertThat(saved.getTenantId()).isEqualTo(tenantId);
        assertThat(saved.getEventType()).isEqualTo("DEPARTMENT_CREATED");
        assertThat(saved.getDepartmentId()).isEqualTo(departmentId);
        assertThat(saved.getDepartmentName()).isEqualTo("개발팀");
        assertThat(saved.getTitle()).isEqualTo("개발팀 부서 생성");
        assertThat(saved.getDescription()).isEqualTo("개발팀 부서가 생성되었습니다.");
        assertThat(saved.getActorId()).isEqualTo(userId);
        assertThat(saved.getActorName()).isEqualTo("관리자");
        assertThat(saved.getEventDate()).isNotNull();
    }

    @Test
    @DisplayName("getOrganizationHistory: 조직 변경 이력 페이지를 반환한다")
    void getOrganizationHistory_returnsPage() {
        // given
        Pageable pageable = PageRequest.of(0, 10);

        OrganizationHistory history1 = OrganizationHistory.builder()
            .tenantId(tenantId)
            .eventType("DEPARTMENT_CREATED")
            .departmentId(departmentId)
            .departmentName("개발팀")
            .title("개발팀 부서 생성")
            .description("개발팀 부서가 생성되었습니다.")
            .actorId(userId)
            .actorName("관리자")
            .eventDate(Instant.now())
            .build();

        OrganizationHistory history2 = OrganizationHistory.builder()
            .tenantId(tenantId)
            .eventType("DEPARTMENT_UPDATED")
            .departmentId(departmentId)
            .departmentName("개발팀")
            .title("개발팀 부서 수정")
            .description("개발팀 부서 정보가 수정되었습니다.")
            .actorId(userId)
            .actorName("관리자")
            .eventDate(Instant.now())
            .build();

        Page<OrganizationHistory> historyPage = new PageImpl<>(
            List.of(history1, history2), pageable, 2);

        when(organizationHistoryRepository.findByTenantIdOrderByEventDateDesc(eq(tenantId), eq(pageable)))
            .thenReturn(historyPage);

        // when
        Page<DepartmentHistoryResponse> result = organizationHistoryService.getOrganizationHistory(pageable);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(2);
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent().get(0).getType()).isEqualTo("department_created");
        assertThat(result.getContent().get(0).getDepartmentName()).isEqualTo("개발팀");
        assertThat(result.getContent().get(0).getActor()).isNotNull();
        assertThat(result.getContent().get(0).getActor().getName()).isEqualTo("관리자");

        verify(organizationHistoryRepository).findByTenantIdOrderByEventDateDesc(tenantId, pageable);
    }

    @Test
    @DisplayName("getDepartmentHistory: 특정 부서의 변경 이력 목록을 반환한다")
    void getDepartmentHistory_returnsList() {
        // given
        OrganizationHistory history = OrganizationHistory.builder()
            .tenantId(tenantId)
            .eventType("DEPARTMENT_CREATED")
            .departmentId(departmentId)
            .departmentName("개발팀")
            .title("개발팀 부서 생성")
            .description("개발팀 부서가 생성되었습니다.")
            .actorId(userId)
            .actorName("관리자")
            .eventDate(Instant.now())
            .build();

        when(organizationHistoryRepository.findByDepartmentIdOrderByEventDateDesc(eq(departmentId)))
            .thenReturn(List.of(history));

        // when
        List<DepartmentHistoryResponse> result = organizationHistoryService.getDepartmentHistory(departmentId);

        // then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getDepartmentId()).isEqualTo(departmentId);
        assertThat(result.get(0).getTitle()).isEqualTo("개발팀 부서 생성");

        verify(organizationHistoryRepository).findByDepartmentIdOrderByEventDateDesc(departmentId);
    }

    @Test
    @DisplayName("onDepartmentCreated: 부서 생성 이벤트 수신 시 이력을 기록한다")
    void onDepartmentCreated_recordsHistory() {
        // given
        DepartmentCreatedEvent event = DepartmentCreatedEvent.builder()
            .departmentId(departmentId)
            .code("DEV01")
            .name("개발팀")
            .level(2)
            .build();

        when(organizationHistoryRepository.save(any(OrganizationHistory.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // when
        organizationHistoryService.onDepartmentCreated(event);

        // then
        verify(organizationHistoryRepository).save(historyCaptor.capture());
        OrganizationHistory saved = historyCaptor.getValue();
        assertThat(saved.getEventType()).isEqualTo("DEPARTMENT_CREATED");
        assertThat(saved.getDepartmentId()).isEqualTo(departmentId);
        assertThat(saved.getDepartmentName()).isEqualTo("개발팀");
        assertThat(saved.getTitle()).isEqualTo("개발팀 부서 생성");
        assertThat(saved.getDescription()).isEqualTo("개발팀 부서가 생성되었습니다.");
        assertThat(saved.getNewValue()).contains("DEV01");
        assertThat(saved.getNewValue()).contains("2");
    }

    @Test
    @DisplayName("onDepartmentMerged: 부서 통합 이벤트 수신 시 이력을 기록한다")
    void onDepartmentMerged_recordsHistory() {
        // given
        UUID source1 = UUID.randomUUID();
        UUID source2 = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        DepartmentMergedEvent event = DepartmentMergedEvent.builder()
            .sourceIds(List.of(source1, source2))
            .targetId(targetId)
            .targetName("통합개발팀")
            .reason("조직 효율화")
            .build();

        when(organizationHistoryRepository.save(any(OrganizationHistory.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // when
        organizationHistoryService.onDepartmentMerged(event);

        // then
        verify(organizationHistoryRepository).save(historyCaptor.capture());
        OrganizationHistory saved = historyCaptor.getValue();
        assertThat(saved.getEventType()).isEqualTo("DEPARTMENT_MERGED");
        assertThat(saved.getDepartmentId()).isEqualTo(targetId);
        assertThat(saved.getDepartmentName()).isEqualTo("통합개발팀");
        assertThat(saved.getTitle()).isEqualTo("부서 통합: 통합개발팀");
        assertThat(saved.getDescription()).contains("2개 부서가");
        assertThat(saved.getDescription()).contains("통합개발팀");
        assertThat(saved.getPreviousValue()).contains("sourceIds");
        assertThat(saved.getNewValue()).contains(targetId.toString());
        assertThat(saved.getMetadata()).isEqualTo("조직 효율화");
    }
}
