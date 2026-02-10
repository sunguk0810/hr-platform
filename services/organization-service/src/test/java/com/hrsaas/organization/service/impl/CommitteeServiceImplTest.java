package com.hrsaas.organization.service.impl;

import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.organization.TestEntityFactory;
import com.hrsaas.organization.domain.dto.request.AddCommitteeMemberRequest;
import com.hrsaas.organization.domain.dto.request.CreateCommitteeRequest;
import com.hrsaas.organization.domain.dto.request.UpdateCommitteeRequest;
import com.hrsaas.organization.domain.dto.response.CommitteeResponse;
import com.hrsaas.organization.domain.entity.Committee;
import com.hrsaas.organization.domain.entity.CommitteeMemberRole;
import com.hrsaas.organization.domain.entity.CommitteeStatus;
import com.hrsaas.organization.domain.entity.CommitteeType;
import com.hrsaas.organization.repository.CommitteeMemberRepository;
import com.hrsaas.organization.repository.CommitteeRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommitteeServiceImplTest {

    @Mock
    private CommitteeRepository committeeRepository;

    @Mock
    private CommitteeMemberRepository committeeMemberRepository;

    @InjectMocks
    private CommitteeServiceImpl committeeService;

    private UUID tenantId;
    private UUID committeeId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        committeeId = UUID.randomUUID();
        TenantContext.setCurrentTenant(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // ===== create =====

    @Test
    @DisplayName("create: success - returns CommitteeResponse")
    void create_success_returnsResponse() {
        // given
        CreateCommitteeRequest request = CreateCommitteeRequest.builder()
                .code("SAFETY_COM")
                .name("안전위원회")
                .nameEn("Safety Committee")
                .type(CommitteeType.PERMANENT)
                .purpose("사업장 안전 관리")
                .startDate(LocalDate.of(2026, 1, 1))
                .meetingSchedule("매월 첫째 월요일")
                .build();

        when(committeeRepository.existsByCodeAndTenantId("SAFETY_COM", tenantId)).thenReturn(false);
        when(committeeRepository.save(any(Committee.class))).thenAnswer(invocation -> {
            Committee saved = invocation.getArgument(0);
            TestEntityFactory.setEntityId(saved, committeeId);
            return saved;
        });

        // when
        CommitteeResponse response = committeeService.create(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getCode()).isEqualTo("SAFETY_COM");
        assertThat(response.getName()).isEqualTo("안전위원회");
        assertThat(response.getNameEn()).isEqualTo("Safety Committee");
        assertThat(response.getType()).isEqualTo(CommitteeType.PERMANENT);
        assertThat(response.getStatus()).isEqualTo(CommitteeStatus.ACTIVE);

        verify(committeeRepository).existsByCodeAndTenantId("SAFETY_COM", tenantId);
        verify(committeeRepository).save(any(Committee.class));
    }

    @Test
    @DisplayName("create: duplicate code - throws DuplicateException")
    void create_duplicateCode_throwsDuplicateException() {
        // given
        CreateCommitteeRequest request = CreateCommitteeRequest.builder()
                .code("SAFETY_COM")
                .name("안전위원회")
                .type(CommitteeType.PERMANENT)
                .build();

        when(committeeRepository.existsByCodeAndTenantId("SAFETY_COM", tenantId)).thenReturn(true);

        // when & then
        assertThatThrownBy(() -> committeeService.create(request))
                .isInstanceOf(DuplicateException.class);

        verify(committeeRepository, never()).save(any(Committee.class));
    }

    // ===== getById =====

    @Test
    @DisplayName("getById: exists - returns CommitteeResponse with members")
    void getById_exists_returnsResponse() {
        // given
        Committee committee = TestEntityFactory.createCommittee(committeeId, "SAFETY_COM", "안전위원회");

        when(committeeRepository.findByIdWithMembers(committeeId, tenantId))
                .thenReturn(Optional.of(committee));

        // when
        CommitteeResponse response = committeeService.getById(committeeId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(committeeId);
        assertThat(response.getCode()).isEqualTo("SAFETY_COM");
        assertThat(response.getName()).isEqualTo("안전위원회");
        assertThat(response.getStatus()).isEqualTo(CommitteeStatus.ACTIVE);

        verify(committeeRepository).findByIdWithMembers(committeeId, tenantId);
    }

    // ===== update =====

    @Test
    @DisplayName("update: success - updates fields and returns response")
    void update_success_returnsResponse() {
        // given
        Committee committee = TestEntityFactory.createCommittee(committeeId, "SAFETY_COM", "안전위원회");

        UpdateCommitteeRequest request = UpdateCommitteeRequest.builder()
                .name("산업안전위원회")
                .nameEn("Industrial Safety Committee")
                .purpose("사업장 산업안전 관리 강화")
                .meetingSchedule("격주 수요일")
                .build();

        when(committeeRepository.findByIdAndTenantId(committeeId, tenantId))
                .thenReturn(Optional.of(committee));
        when(committeeRepository.save(any(Committee.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // when
        CommitteeResponse response = committeeService.update(committeeId, request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("산업안전위원회");
        assertThat(response.getNameEn()).isEqualTo("Industrial Safety Committee");

        verify(committeeRepository).save(committee);
    }

    // ===== addMember =====

    @Test
    @DisplayName("addMember: success - returns MemberResponse")
    void addMember_success_returnsMemberResponse() {
        // given
        UUID employeeId = UUID.randomUUID();
        Committee committee = TestEntityFactory.createCommittee(committeeId, "SAFETY_COM", "안전위원회");

        AddCommitteeMemberRequest request = AddCommitteeMemberRequest.builder()
                .employeeId(employeeId)
                .employeeName("홍길동")
                .departmentName("총무팀")
                .positionName("과장")
                .role(CommitteeMemberRole.MEMBER)
                .joinDate(LocalDate.of(2026, 2, 1))
                .build();

        when(committeeRepository.findByIdAndTenantId(committeeId, tenantId))
                .thenReturn(Optional.of(committee));
        when(committeeMemberRepository.existsByCommitteeIdAndEmployeeIdAndIsActiveTrue(committeeId, employeeId))
                .thenReturn(false);
        when(committeeRepository.save(any(Committee.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // when
        CommitteeResponse.MemberResponse response = committeeService.addMember(committeeId, request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getEmployeeId()).isEqualTo(employeeId);
        assertThat(response.getEmployeeName()).isEqualTo("홍길동");
        assertThat(response.getDepartmentName()).isEqualTo("총무팀");
        assertThat(response.getRole()).isEqualTo(CommitteeMemberRole.MEMBER);
        assertThat(response.getIsActive()).isTrue();

        verify(committeeRepository).save(committee);
    }

    @Test
    @DisplayName("addMember: duplicate active member - throws DuplicateException")
    void addMember_duplicate_throwsDuplicateException() {
        // given
        UUID employeeId = UUID.randomUUID();
        Committee committee = TestEntityFactory.createCommittee(committeeId, "SAFETY_COM", "안전위원회");

        AddCommitteeMemberRequest request = AddCommitteeMemberRequest.builder()
                .employeeId(employeeId)
                .employeeName("홍길동")
                .role(CommitteeMemberRole.MEMBER)
                .build();

        when(committeeRepository.findByIdAndTenantId(committeeId, tenantId))
                .thenReturn(Optional.of(committee));
        when(committeeMemberRepository.existsByCommitteeIdAndEmployeeIdAndIsActiveTrue(committeeId, employeeId))
                .thenReturn(true);

        // when & then
        assertThatThrownBy(() -> committeeService.addMember(committeeId, request))
                .isInstanceOf(DuplicateException.class);

        verify(committeeRepository, never()).save(any(Committee.class));
    }

    // ===== dissolve =====

    @Test
    @DisplayName("dissolve: success - sets status to DISSOLVED")
    void dissolve_success() {
        // given
        Committee committee = TestEntityFactory.createCommittee(committeeId, "TEMP_COM", "임시위원회");
        assertThat(committee.getStatus()).isEqualTo(CommitteeStatus.ACTIVE);

        when(committeeRepository.findByIdAndTenantId(committeeId, tenantId))
                .thenReturn(Optional.of(committee));
        when(committeeRepository.save(any(Committee.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // when
        committeeService.dissolve(committeeId);

        // then
        assertThat(committee.getStatus()).isEqualTo(CommitteeStatus.DISSOLVED);
        verify(committeeRepository).save(committee);
    }
}
