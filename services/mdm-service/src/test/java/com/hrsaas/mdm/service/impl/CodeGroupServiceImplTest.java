package com.hrsaas.mdm.service.impl;

import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.entity.BaseEntity;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.security.PermissionChecker;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.mdm.domain.dto.request.CreateCodeGroupRequest;
import com.hrsaas.mdm.domain.dto.response.CodeGroupResponse;
import com.hrsaas.mdm.domain.entity.CodeGroup;
import com.hrsaas.mdm.repository.CodeGroupRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CodeGroupServiceImplTest {

    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final UUID GROUP_ID = UUID.randomUUID();

    @Mock
    private CodeGroupRepository codeGroupRepository;

    @Mock
    private EventPublisher eventPublisher;

    @Mock
    private PermissionChecker permissionChecker;

    @InjectMocks
    private CodeGroupServiceImpl codeGroupService;

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // ================================================================
    // create
    // ================================================================

    @Test
    @DisplayName("create - valid request returns created group")
    void create_validRequest_returnsCreatedGroup() {
        // given
        CreateCodeGroupRequest request = CreateCodeGroupRequest.builder()
            .groupCode("LEAVE_TYPE")
            .groupName("휴가 유형")
            .description("휴가 유형 코드 그룹")
            .build();

        CodeGroup savedGroup = createTestCodeGroup(GROUP_ID, "LEAVE_TYPE", "휴가 유형", false);

        when(codeGroupRepository.existsByGroupCodeAndTenantId("LEAVE_TYPE", TENANT_ID)).thenReturn(false);
        when(codeGroupRepository.save(any(CodeGroup.class))).thenReturn(savedGroup);

        // when
        CodeGroupResponse result = codeGroupService.create(request);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getGroupCode()).isEqualTo("LEAVE_TYPE");
        assertThat(result.getGroupName()).isEqualTo("휴가 유형");
        verify(codeGroupRepository).save(any(CodeGroup.class));
        verify(eventPublisher).publish(any());
    }

    @Test
    @DisplayName("create - duplicate group code throws DuplicateException")
    void create_duplicateGroupCode_throwsDuplicateException() {
        // given
        CreateCodeGroupRequest request = CreateCodeGroupRequest.builder()
            .groupCode("LEAVE_TYPE")
            .groupName("휴가 유형")
            .build();

        when(codeGroupRepository.existsByGroupCodeAndTenantId("LEAVE_TYPE", TENANT_ID)).thenReturn(true);

        // when & then
        assertThatThrownBy(() -> codeGroupService.create(request))
            .isInstanceOf(DuplicateException.class)
            .hasMessageContaining("이미 존재하는 그룹 코드입니다");

        verify(codeGroupRepository, never()).save(any());
    }

    // ================================================================
    // getByGroupCode
    // ================================================================

    @Test
    @DisplayName("getByGroupCode - exists returns group")
    void getByGroupCode_exists_returnsGroup() {
        // given
        CodeGroup codeGroup = createTestCodeGroup(GROUP_ID, "LEAVE_TYPE", "휴가 유형", false);

        when(codeGroupRepository.findByGroupCodeAndTenant("LEAVE_TYPE", TENANT_ID))
            .thenReturn(Optional.of(codeGroup));

        // when
        CodeGroupResponse result = codeGroupService.getByGroupCode("LEAVE_TYPE");

        // then
        assertThat(result).isNotNull();
        assertThat(result.getGroupCode()).isEqualTo("LEAVE_TYPE");
    }

    @Test
    @DisplayName("getByGroupCode - not found throws NotFoundException")
    void getByGroupCode_notFound_throwsNotFoundException() {
        // given
        when(codeGroupRepository.findByGroupCodeAndTenant("UNKNOWN", TENANT_ID))
            .thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> codeGroupService.getByGroupCode("UNKNOWN"))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("코드 그룹을 찾을 수 없습니다");
    }

    // ================================================================
    // getAll
    // ================================================================

    @Test
    @DisplayName("getAll - with tenant returns groups for tenant")
    void getAll_withTenant_returnsForTenant() {
        // given
        CodeGroup group1 = createTestCodeGroup(UUID.randomUUID(), "LEAVE_TYPE", "휴가 유형", false);
        CodeGroup group2 = createTestCodeGroup(UUID.randomUUID(), "GRADE", "직급", false);

        when(codeGroupRepository.findAllForTenant(TENANT_ID)).thenReturn(List.of(group1, group2));

        // when
        List<CodeGroupResponse> result = codeGroupService.getAll();

        // then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getGroupCode()).isEqualTo("LEAVE_TYPE");
        assertThat(result.get(1).getGroupCode()).isEqualTo("GRADE");
        verify(codeGroupRepository).findAllForTenant(TENANT_ID);
    }

    // ================================================================
    // delete
    // ================================================================

    @Test
    @DisplayName("delete - non-system group deletes successfully")
    void delete_nonSystemGroup_deletes() {
        // given
        CodeGroup codeGroup = createTestCodeGroup(GROUP_ID, "CUSTOM_TYPE", "커스텀", false);

        when(codeGroupRepository.findById(GROUP_ID)).thenReturn(Optional.of(codeGroup));

        // when
        codeGroupService.delete(GROUP_ID);

        // then
        verify(codeGroupRepository).delete(codeGroup);
    }

    @Test
    @DisplayName("delete - system group throws IllegalStateException")
    void delete_systemGroup_throwsIllegalState() {
        // given
        CodeGroup codeGroup = createTestCodeGroup(GROUP_ID, "SYSTEM_TYPE", "시스템", true);

        when(codeGroupRepository.findById(GROUP_ID)).thenReturn(Optional.of(codeGroup));

        // when & then
        assertThatThrownBy(() -> codeGroupService.delete(GROUP_ID))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("시스템 코드 그룹은 삭제할 수 없습니다");

        verify(codeGroupRepository, never()).delete(any());
    }

    // ================================================================
    // Helper methods
    // ================================================================

    private CodeGroup createTestCodeGroup(UUID id, String groupCode, String groupName, boolean system) {
        CodeGroup codeGroup = CodeGroup.builder()
            .tenantId(TENANT_ID)
            .groupCode(groupCode)
            .groupName(groupName)
            .system(system)
            .build();
        setEntityId(codeGroup, id);
        return codeGroup;
    }

    private void setEntityId(Object entity, UUID id) {
        try {
            java.lang.reflect.Field idField = BaseEntity.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(entity, id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
