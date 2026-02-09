package com.hrsaas.mdm.service.impl;

import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.entity.BaseEntity;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.security.PermissionChecker;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.mdm.domain.dto.request.CreateCommonCodeRequest;
import com.hrsaas.mdm.domain.dto.request.UpdateCommonCodeRequest;
import com.hrsaas.mdm.domain.dto.response.CommonCodeResponse;
import com.hrsaas.mdm.domain.entity.CodeGroup;
import com.hrsaas.mdm.domain.entity.CodeStatus;
import com.hrsaas.mdm.domain.entity.CommonCode;
import com.hrsaas.mdm.repository.CodeGroupRepository;
import com.hrsaas.mdm.repository.CommonCodeRepository;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommonCodeServiceImplTest {

    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final UUID CODE_GROUP_ID = UUID.randomUUID();
    private static final UUID CODE_ID = UUID.randomUUID();

    @Mock
    private CommonCodeRepository commonCodeRepository;

    @Mock
    private CodeGroupRepository codeGroupRepository;

    @Mock
    private EventPublisher eventPublisher;

    @Mock
    private PermissionChecker permissionChecker;

    @InjectMocks
    private CommonCodeServiceImpl commonCodeService;

    private CodeGroup testCodeGroup;

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_ID);
        testCodeGroup = createTestCodeGroup(CODE_GROUP_ID, "LEAVE_TYPE");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // ================================================================
    // create
    // ================================================================

    @Test
    @DisplayName("create - valid request returns created code")
    void create_validRequest_returnsCreatedCode() {
        // given
        CreateCommonCodeRequest request = CreateCommonCodeRequest.builder()
            .codeGroupId(CODE_GROUP_ID)
            .code("ANNUAL")
            .codeName("연차")
            .sortOrder(1)
            .build();

        CommonCode savedCode = createTestCode(CODE_ID, testCodeGroup, "ANNUAL", "연차");

        when(codeGroupRepository.findById(CODE_GROUP_ID)).thenReturn(Optional.of(testCodeGroup));
        when(commonCodeRepository.existsByCodeGroupIdAndCodeAndTenantId(CODE_GROUP_ID, "ANNUAL", TENANT_ID))
            .thenReturn(false);
        when(commonCodeRepository.save(any(CommonCode.class))).thenReturn(savedCode);

        // when
        CommonCodeResponse result = commonCodeService.create(request);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getCode()).isEqualTo("ANNUAL");
        assertThat(result.getCodeName()).isEqualTo("연차");
        assertThat(result.getGroupCode()).isEqualTo("LEAVE_TYPE");
        verify(commonCodeRepository).save(any(CommonCode.class));
        verify(eventPublisher).publish(any());
    }

    @Test
    @DisplayName("create - duplicate code throws DuplicateException")
    void create_duplicateCode_throwsDuplicateException() {
        // given
        CreateCommonCodeRequest request = CreateCommonCodeRequest.builder()
            .codeGroupId(CODE_GROUP_ID)
            .code("ANNUAL")
            .codeName("연차")
            .build();

        when(codeGroupRepository.findById(CODE_GROUP_ID)).thenReturn(Optional.of(testCodeGroup));
        when(commonCodeRepository.existsByCodeGroupIdAndCodeAndTenantId(CODE_GROUP_ID, "ANNUAL", TENANT_ID))
            .thenReturn(true);

        // when & then
        assertThatThrownBy(() -> commonCodeService.create(request))
            .isInstanceOf(DuplicateException.class)
            .hasMessageContaining("이미 존재하는 코드입니다");

        verify(commonCodeRepository, never()).save(any());
    }

    @Test
    @DisplayName("create - group not found throws NotFoundException")
    void create_groupNotFound_throwsNotFoundException() {
        // given
        CreateCommonCodeRequest request = CreateCommonCodeRequest.builder()
            .codeGroupId(CODE_GROUP_ID)
            .code("ANNUAL")
            .codeName("연차")
            .build();

        when(codeGroupRepository.findById(CODE_GROUP_ID)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> commonCodeService.create(request))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("코드 그룹을 찾을 수 없습니다");

        verify(commonCodeRepository, never()).save(any());
    }

    @Test
    @DisplayName("create - exceeds max depth throws BusinessException")
    void create_exceedsMaxDepth_throwsBusinessException() {
        // given
        // Build a parent chain of depth 4 (level1 -> level2 -> level3 -> level4)
        UUID parentLevel1Id = UUID.randomUUID();
        UUID parentLevel2Id = UUID.randomUUID();
        UUID parentLevel3Id = UUID.randomUUID();
        UUID parentLevel4Id = UUID.randomUUID();

        CommonCode level4 = createTestCode(parentLevel4Id, testCodeGroup, "L4", "Level 4");
        level4.setParentCodeId(parentLevel3Id);

        CommonCode level3 = createTestCode(parentLevel3Id, testCodeGroup, "L3", "Level 3");
        level3.setParentCodeId(parentLevel2Id);

        CommonCode level2 = createTestCode(parentLevel2Id, testCodeGroup, "L2", "Level 2");
        level2.setParentCodeId(parentLevel1Id);

        CommonCode level1 = createTestCode(parentLevel1Id, testCodeGroup, "L1", "Level 1");
        // level1 has no parent (root)

        CreateCommonCodeRequest request = CreateCommonCodeRequest.builder()
            .codeGroupId(CODE_GROUP_ID)
            .parentCodeId(parentLevel4Id)
            .code("L5")
            .codeName("Level 5")
            .build();

        when(codeGroupRepository.findById(CODE_GROUP_ID)).thenReturn(Optional.of(testCodeGroup));
        when(commonCodeRepository.existsByCodeGroupIdAndCodeAndTenantId(CODE_GROUP_ID, "L5", TENANT_ID))
            .thenReturn(false);
        // For the parent code lookup in create
        when(commonCodeRepository.findById(parentLevel4Id)).thenReturn(Optional.of(level4));
        // For the depth validation chain
        when(commonCodeRepository.findById(parentLevel3Id)).thenReturn(Optional.of(level3));
        when(commonCodeRepository.findById(parentLevel2Id)).thenReturn(Optional.of(level2));
        when(commonCodeRepository.findById(parentLevel1Id)).thenReturn(Optional.of(level1));

        // when & then
        assertThatThrownBy(() -> commonCodeService.create(request))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("최대 4단계까지만 허용");

        verify(commonCodeRepository, never()).save(any());
    }

    // ================================================================
    // getById
    // ================================================================

    @Test
    @DisplayName("getById - exists returns code")
    void getById_exists_returnsCode() {
        // given
        CommonCode code = createTestCode(CODE_ID, testCodeGroup, "ANNUAL", "연차");
        when(commonCodeRepository.findById(CODE_ID)).thenReturn(Optional.of(code));

        // when
        CommonCodeResponse result = commonCodeService.getById(CODE_ID);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(CODE_ID);
        assertThat(result.getCode()).isEqualTo("ANNUAL");
    }

    @Test
    @DisplayName("getById - not found throws NotFoundException")
    void getById_notFound_throwsNotFoundException() {
        // given
        when(commonCodeRepository.findById(CODE_ID)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> commonCodeService.getById(CODE_ID))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("코드를 찾을 수 없습니다");
    }

    // ================================================================
    // getByGroupCode
    // ================================================================

    @Test
    @DisplayName("getByGroupCode - returns filtered codes")
    void getByGroupCode_returnsFilteredCodes() {
        // given
        CommonCode code1 = createTestCode(UUID.randomUUID(), testCodeGroup, "ANNUAL", "연차");
        CommonCode code2 = createTestCode(UUID.randomUUID(), testCodeGroup, "SICK", "병가");

        when(commonCodeRepository.findByGroupCode("LEAVE_TYPE", TENANT_ID))
            .thenReturn(List.of(code1, code2));

        // when
        List<CommonCodeResponse> result = commonCodeService.getByGroupCode("LEAVE_TYPE");

        // then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getCode()).isEqualTo("ANNUAL");
        assertThat(result.get(1).getCode()).isEqualTo("SICK");
    }

    // ================================================================
    // update
    // ================================================================

    @Test
    @DisplayName("update - valid request returns updated")
    void update_validRequest_returnsUpdated() {
        // given
        CommonCode existingCode = createTestCode(CODE_ID, testCodeGroup, "ANNUAL", "연차");
        UpdateCommonCodeRequest request = UpdateCommonCodeRequest.builder()
            .codeName("연차휴가")
            .sortOrder(2)
            .build();

        when(commonCodeRepository.findById(CODE_ID)).thenReturn(Optional.of(existingCode));
        when(commonCodeRepository.save(any(CommonCode.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        CommonCodeResponse result = commonCodeService.update(CODE_ID, request);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getCodeName()).isEqualTo("연차휴가");
        verify(commonCodeRepository).save(any(CommonCode.class));
        verify(eventPublisher).publish(any());
    }

    // ================================================================
    // activate
    // ================================================================

    @Test
    @DisplayName("activate - success sets status active")
    void activate_success_setsStatusActive() {
        // given
        CommonCode code = createTestCode(CODE_ID, testCodeGroup, "ANNUAL", "연차");
        code.deactivate(); // first set to inactive

        when(commonCodeRepository.findById(CODE_ID)).thenReturn(Optional.of(code));
        when(commonCodeRepository.save(any(CommonCode.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        CommonCodeResponse result = commonCodeService.activate(CODE_ID);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(CodeStatus.ACTIVE);
        assertThat(result.isActive()).isTrue();
    }

    // ================================================================
    // deactivate
    // ================================================================

    @Test
    @DisplayName("deactivate - success sets status inactive")
    void deactivate_success_setsStatusInactive() {
        // given
        CommonCode code = createTestCode(CODE_ID, testCodeGroup, "ANNUAL", "연차");

        when(commonCodeRepository.findById(CODE_ID)).thenReturn(Optional.of(code));
        when(commonCodeRepository.save(any(CommonCode.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        CommonCodeResponse result = commonCodeService.deactivate(CODE_ID);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(CodeStatus.INACTIVE);
        assertThat(result.isActive()).isFalse();
    }

    // ================================================================
    // delete
    // ================================================================

    @Test
    @DisplayName("delete - success deletes code")
    void delete_success_deletesCode() {
        // given
        CommonCode code = createTestCode(CODE_ID, testCodeGroup, "ANNUAL", "연차");
        when(commonCodeRepository.findById(CODE_ID)).thenReturn(Optional.of(code));

        // when
        commonCodeService.delete(CODE_ID);

        // then
        verify(commonCodeRepository).delete(code);
    }

    // ================================================================
    // Helper methods
    // ================================================================

    private CommonCode createTestCode(UUID id, CodeGroup codeGroup, String code, String codeName) {
        CommonCode commonCode = CommonCode.builder()
            .codeGroup(codeGroup)
            .tenantId(TENANT_ID)
            .code(code)
            .codeName(codeName)
            .level(1)
            .build();
        setEntityId(commonCode, id);
        return commonCode;
    }

    private CodeGroup createTestCodeGroup(UUID id, String groupCode) {
        CodeGroup codeGroup = CodeGroup.builder()
            .tenantId(TENANT_ID)
            .groupCode(groupCode)
            .groupName("테스트 그룹")
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
