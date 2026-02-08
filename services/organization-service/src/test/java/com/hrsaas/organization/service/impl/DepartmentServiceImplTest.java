package com.hrsaas.organization.service.impl;

import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.organization.TestEntityFactory;
import com.hrsaas.organization.client.EmployeeClient;
import com.hrsaas.organization.client.dto.BulkTransferRequest;
import com.hrsaas.organization.domain.dto.request.CreateDepartmentRequest;
import com.hrsaas.organization.domain.dto.request.DepartmentMergeRequest;
import com.hrsaas.organization.domain.dto.request.DepartmentSplitRequest;
import com.hrsaas.organization.domain.dto.request.UpdateDepartmentRequest;
import com.hrsaas.organization.domain.dto.response.DepartmentMergeResponse;
import com.hrsaas.organization.domain.dto.response.DepartmentResponse;
import com.hrsaas.organization.domain.dto.response.DepartmentSplitResponse;
import com.hrsaas.organization.domain.entity.Department;
import com.hrsaas.organization.domain.entity.DepartmentStatus;
import com.hrsaas.organization.repository.DepartmentRepository;
import com.hrsaas.organization.service.OrganizationHistoryService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
class DepartmentServiceImplTest {

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private EventPublisher eventPublisher;

    @Mock
    private EmployeeClient employeeClient;

    @Mock
    private OrganizationHistoryService organizationHistoryService;

    @InjectMocks
    private DepartmentServiceImpl departmentService;

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

    // ===== create =====

    @Test
    @DisplayName("create: success - returns DepartmentResponse")
    void create_success_returnsDepartmentResponse() {
        // given
        UUID deptId = UUID.randomUUID();
        CreateDepartmentRequest request = CreateDepartmentRequest.builder()
                .code("DEV001")
                .name("개발팀")
                .nameEn("Development")
                .sortOrder(1)
                .build();

        when(departmentRepository.existsByCodeAndTenantId("DEV001", tenantId)).thenReturn(false);
        when(departmentRepository.save(any(Department.class))).thenAnswer(invocation -> {
            Department dept = invocation.getArgument(0);
            TestEntityFactory.setEntityId(dept, deptId);
            return dept;
        });

        // when
        DepartmentResponse response = departmentService.create(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(deptId);
        assertThat(response.getCode()).isEqualTo("DEV001");
        assertThat(response.getName()).isEqualTo("개발팀");
        assertThat(response.getLevel()).isEqualTo(1);
        assertThat(response.getStatus()).isEqualTo(DepartmentStatus.ACTIVE);

        verify(departmentRepository).save(any(Department.class));
        verify(eventPublisher).publish(any(DomainEvent.class));
    }

    @Test
    @DisplayName("create: duplicate code - throws DuplicateException")
    void create_duplicateCode_throwsDuplicateException() {
        // given
        CreateDepartmentRequest request = CreateDepartmentRequest.builder()
                .code("DEV001")
                .name("개발팀")
                .build();

        when(departmentRepository.existsByCodeAndTenantId("DEV001", tenantId)).thenReturn(true);

        // when & then
        assertThatThrownBy(() -> departmentService.create(request))
                .isInstanceOf(DuplicateException.class)
                .hasMessageContaining("DEV001");

        verify(departmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("create: with parentId - sets parent and level 2")
    void create_withParent_setsParent() {
        // given
        UUID parentId = UUID.randomUUID();
        UUID deptId = UUID.randomUUID();

        Department parent = TestEntityFactory.createDepartment(parentId, "DIV001", "사업부");

        CreateDepartmentRequest request = CreateDepartmentRequest.builder()
                .code("DEV001")
                .name("개발팀")
                .parentId(parentId)
                .build();

        when(departmentRepository.existsByCodeAndTenantId("DEV001", tenantId)).thenReturn(false);
        when(departmentRepository.findById(parentId)).thenReturn(Optional.of(parent));
        when(departmentRepository.save(any(Department.class))).thenAnswer(invocation -> {
            Department dept = invocation.getArgument(0);
            TestEntityFactory.setEntityId(dept, deptId);
            return dept;
        });

        // when
        DepartmentResponse response = departmentService.create(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getParentId()).isEqualTo(parentId);
        assertThat(response.getLevel()).isEqualTo(2);

        verify(eventPublisher).publish(any(DomainEvent.class));
    }

    @Test
    @DisplayName("create: depth exceeds limit (G04) - throws BusinessException")
    void create_depthExceedsLimit_throwsBusinessException() {
        // given
        UUID parentId = UUID.randomUUID();

        Department parent = TestEntityFactory.createDepartment(parentId, "DEEP", "깊은부서");
        parent.setLevel(10); // MAX_DEPTH = 10, so parent.getLevel() >= MAX_DEPTH triggers exception

        CreateDepartmentRequest request = CreateDepartmentRequest.builder()
                .code("TOO_DEEP")
                .name("너무깊은부서")
                .parentId(parentId)
                .build();

        when(departmentRepository.existsByCodeAndTenantId("TOO_DEEP", tenantId)).thenReturn(false);
        when(departmentRepository.findById(parentId)).thenReturn(Optional.of(parent));

        // when & then
        assertThatThrownBy(() -> departmentService.create(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("최대");

        verify(departmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("create: invalid managerId (G10) - throws BusinessException")
    void create_invalidManager_throwsBusinessException() {
        // given
        UUID managerId = UUID.randomUUID();

        CreateDepartmentRequest request = CreateDepartmentRequest.builder()
                .code("DEV001")
                .name("개발팀")
                .managerId(managerId)
                .build();

        when(departmentRepository.existsByCodeAndTenantId("DEV001", tenantId)).thenReturn(false);
        when(employeeClient.existsById(managerId)).thenReturn(ApiResponse.success(false));

        // when & then
        assertThatThrownBy(() -> departmentService.create(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("관리자");

        verify(departmentRepository, never()).save(any());
    }

    // ===== getById =====

    @Test
    @DisplayName("getById: exists - returns DepartmentResponse")
    void getById_exists_returnsDepartmentResponse() {
        // given
        UUID deptId = UUID.randomUUID();
        Department department = TestEntityFactory.createDepartment(deptId, "DEV001", "개발팀");

        when(departmentRepository.findById(deptId)).thenReturn(Optional.of(department));

        // when
        DepartmentResponse response = departmentService.getById(deptId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(deptId);
        assertThat(response.getCode()).isEqualTo("DEV001");
        assertThat(response.getName()).isEqualTo("개발팀");
    }

    @Test
    @DisplayName("getById: not found - throws NotFoundException")
    void getById_notFound_throwsNotFoundException() {
        // given
        UUID deptId = UUID.randomUUID();
        when(departmentRepository.findById(deptId)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> departmentService.getById(deptId))
                .isInstanceOf(NotFoundException.class);
    }

    // ===== update =====

    @Test
    @DisplayName("update: name change - success")
    void update_nameChange_success() {
        // given
        UUID deptId = UUID.randomUUID();
        Department department = TestEntityFactory.createDepartment(deptId, "DEV001", "개발팀");

        UpdateDepartmentRequest request = UpdateDepartmentRequest.builder()
                .name("개발1팀")
                .build();

        when(departmentRepository.findById(deptId)).thenReturn(Optional.of(department));
        when(departmentRepository.save(any(Department.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        DepartmentResponse response = departmentService.update(deptId, request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("개발1팀");
        assertThat(response.getCode()).isEqualTo("DEV001");

        verify(departmentRepository).save(any(Department.class));
        verify(eventPublisher).publish(any(DomainEvent.class));
    }

    // ===== delete =====

    @Test
    @DisplayName("delete: no employees (G01) - success")
    void delete_noEmployees_success() {
        // given
        UUID deptId = UUID.randomUUID();
        Department department = TestEntityFactory.createDepartment(deptId, "DEV001", "개발팀");

        when(departmentRepository.findById(deptId)).thenReturn(Optional.of(department));
        when(employeeClient.countByDepartmentId(deptId)).thenReturn(ApiResponse.success(0L));
        when(departmentRepository.save(any(Department.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        departmentService.delete(deptId);

        // then
        verify(departmentRepository).save(argThat(dept -> dept.getStatus() == DepartmentStatus.DELETED));
        verify(organizationHistoryService).recordEvent(
                eq("DEPARTMENT_DELETED"), eq(deptId), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("delete: has employees (G01) - throws BusinessException")
    void delete_hasEmployees_throwsBusinessException() {
        // given
        UUID deptId = UUID.randomUUID();
        Department department = TestEntityFactory.createDepartment(deptId, "DEV001", "개발팀");

        when(departmentRepository.findById(deptId)).thenReturn(Optional.of(department));
        when(employeeClient.countByDepartmentId(deptId)).thenReturn(ApiResponse.success(5L));

        // when & then
        assertThatThrownBy(() -> departmentService.delete(deptId))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("직원");

        verify(departmentRepository, never()).save(argThat(dept -> dept.getStatus() == DepartmentStatus.DELETED));
    }

    // ===== merge =====

    @Test
    @DisplayName("merge: success (G06) - returns DepartmentMergeResponse")
    void merge_success_returnsResponse() {
        // given
        UUID sourceId1 = UUID.randomUUID();
        UUID sourceId2 = UUID.randomUUID();

        Department source1 = TestEntityFactory.createDepartment(sourceId1, "SRC001", "소스부서1");
        Department source2 = TestEntityFactory.createDepartment(sourceId2, "SRC002", "소스부서2");

        DepartmentMergeRequest request = DepartmentMergeRequest.builder()
                .sourceDepartmentIds(List.of(sourceId1, sourceId2))
                .targetDepartmentId(null) // create new target
                .targetDepartmentName("통합부서")
                .targetDepartmentCode("MERGED001")
                .reason("조직 통합")
                .effectiveDate(LocalDate.now())
                .build();

        when(departmentRepository.findById(sourceId1)).thenReturn(Optional.of(source1));
        when(departmentRepository.findById(sourceId2)).thenReturn(Optional.of(source2));
        when(departmentRepository.existsByCodeAndTenantId("MERGED001", tenantId)).thenReturn(false);
        when(departmentRepository.save(any(Department.class))).thenAnswer(invocation -> {
            Department dept = invocation.getArgument(0);
            if (dept.getId() == null) {
                TestEntityFactory.setEntityId(dept, UUID.randomUUID());
            }
            return dept;
        });
        when(employeeClient.countByDepartmentId(sourceId1)).thenReturn(ApiResponse.success(3L));
        when(employeeClient.countByDepartmentId(sourceId2)).thenReturn(ApiResponse.success(2L));
        when(employeeClient.bulkTransferDepartment(any(BulkTransferRequest.class)))
                .thenReturn(ApiResponse.success(5));

        // when
        DepartmentMergeResponse response = departmentService.merge(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getTargetDepartment()).isNotNull();
        assertThat(response.getTargetDepartment().getCode()).isEqualTo("MERGED001");
        assertThat(response.getTargetDepartment().getName()).isEqualTo("통합부서");
        assertThat(response.getMergedDepartmentIds()).hasSize(2);
        assertThat(response.getTransferredEmployeeCount()).isEqualTo(5);

        verify(eventPublisher).publish(any(DomainEvent.class));
    }

    // ===== split =====

    @Test
    @DisplayName("split: success (G06) - returns DepartmentSplitResponse")
    void split_success_returnsResponse() {
        // given
        UUID sourceId = UUID.randomUUID();
        UUID emp1 = UUID.randomUUID();
        UUID emp2 = UUID.randomUUID();

        Department source = TestEntityFactory.createDepartment(sourceId, "SRC001", "원본부서");

        DepartmentSplitRequest.SplitTarget target1 = DepartmentSplitRequest.SplitTarget.builder()
                .name("분할부서A")
                .code("SPLIT_A")
                .employeeIds(List.of(emp1))
                .build();

        DepartmentSplitRequest.SplitTarget target2 = DepartmentSplitRequest.SplitTarget.builder()
                .name("분할부서B")
                .code("SPLIT_B")
                .employeeIds(List.of(emp2))
                .build();

        DepartmentSplitRequest request = DepartmentSplitRequest.builder()
                .sourceDepartmentId(sourceId)
                .newDepartments(List.of(target1, target2))
                .keepSource(false)
                .reason("조직 분할")
                .build();

        when(departmentRepository.findById(sourceId)).thenReturn(Optional.of(source));
        when(departmentRepository.existsByCodeAndTenantId("SPLIT_A", tenantId)).thenReturn(false);
        when(departmentRepository.existsByCodeAndTenantId("SPLIT_B", tenantId)).thenReturn(false);
        when(departmentRepository.save(any(Department.class))).thenAnswer(invocation -> {
            Department dept = invocation.getArgument(0);
            if (dept.getId() == null) {
                TestEntityFactory.setEntityId(dept, UUID.randomUUID());
            }
            return dept;
        });
        when(employeeClient.bulkTransferDepartment(any(BulkTransferRequest.class)))
                .thenReturn(ApiResponse.success(1));

        // when
        DepartmentSplitResponse response = departmentService.split(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getSourceDepartmentId()).isEqualTo(sourceId);
        assertThat(response.getNewDepartments()).hasSize(2);
        assertThat(response.isSourceKept()).isFalse();

        // source should be deactivated since keepSource=false
        assertThat(source.getStatus()).isEqualTo(DepartmentStatus.INACTIVE);

        verify(employeeClient, times(2)).bulkTransferDepartment(any(BulkTransferRequest.class));
        verify(eventPublisher).publish(any(DomainEvent.class));
    }
}
