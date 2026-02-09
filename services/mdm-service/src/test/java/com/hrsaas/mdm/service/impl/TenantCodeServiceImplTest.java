package com.hrsaas.mdm.service.impl;

import com.hrsaas.common.entity.BaseEntity;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.mdm.domain.dto.request.UpdateTenantCodeRequest;
import com.hrsaas.mdm.domain.dto.response.TenantCodeResponse;
import com.hrsaas.mdm.domain.entity.CodeGroup;
import com.hrsaas.mdm.domain.entity.CodeTenantMapping;
import com.hrsaas.mdm.domain.entity.CommonCode;
import com.hrsaas.mdm.repository.CodeTenantMappingRepository;
import com.hrsaas.mdm.repository.CommonCodeRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TenantCodeServiceImplTest {

    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final UUID CODE_ID = UUID.randomUUID();
    private static final UUID CODE_GROUP_ID = UUID.randomUUID();
    private static final UUID MAPPING_ID = UUID.randomUUID();

    @Mock
    private CodeTenantMappingRepository codeTenantMappingRepository;

    @Mock
    private CommonCodeRepository commonCodeRepository;

    @InjectMocks
    private TenantCodeServiceImpl tenantCodeService;

    private CodeGroup testCodeGroup;
    private CommonCode testCommonCode;

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_ID);
        testCodeGroup = createTestCodeGroup(CODE_GROUP_ID, "LEAVE_TYPE");
        testCommonCode = createTestCode(CODE_ID, testCodeGroup, "ANNUAL", "연차");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // ================================================================
    // getByCodeId
    // ================================================================

    @Test
    @DisplayName("getByCodeId - existing mapping returns mapping")
    void getByCodeId_existingMapping_returnsMapping() {
        // given
        CodeTenantMapping mapping = createTestMapping(MAPPING_ID, testCommonCode);
        mapping.setCustomCodeName("커스텀 연차");

        when(codeTenantMappingRepository.findByTenantIdAndCodeId(TENANT_ID, CODE_ID))
            .thenReturn(Optional.of(mapping));

        // when
        TenantCodeResponse result = tenantCodeService.getByCodeId(CODE_ID);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(result.getCustomCodeName()).isEqualTo("커스텀 연차");
    }

    // ================================================================
    // getByGroupCode
    // ================================================================

    @Test
    @DisplayName("getByGroupCode - no mappings returns default responses")
    void getByGroupCode_noMappings_returnsDefaultResponses() {
        // given
        when(codeTenantMappingRepository.findByTenantIdAndGroupCode(TENANT_ID, "LEAVE_TYPE"))
            .thenReturn(Collections.emptyList());
        when(commonCodeRepository.findByGroupCode("LEAVE_TYPE", TENANT_ID))
            .thenReturn(List.of(testCommonCode));

        // when
        List<TenantCodeResponse> result = tenantCodeService.getByGroupCode("LEAVE_TYPE");

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCode()).isEqualTo("ANNUAL");
        assertThat(result.get(0).isCustomized()).isFalse();
        assertThat(result.get(0).getEffectiveCodeName()).isEqualTo("연차");
    }

    // ================================================================
    // update
    // ================================================================

    @Test
    @DisplayName("update - success returns updated")
    void update_success_returnsUpdated() {
        // given
        CodeTenantMapping mapping = createTestMapping(MAPPING_ID, testCommonCode);

        UpdateTenantCodeRequest request = UpdateTenantCodeRequest.builder()
            .customCodeName("커스텀 연차")
            .customSortOrder(10)
            .build();

        when(codeTenantMappingRepository.findByTenantIdAndCodeId(TENANT_ID, CODE_ID))
            .thenReturn(Optional.of(mapping));
        when(codeTenantMappingRepository.save(any(CodeTenantMapping.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // when
        TenantCodeResponse result = tenantCodeService.update(CODE_ID, request);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getCustomCodeName()).isEqualTo("커스텀 연차");
        verify(codeTenantMappingRepository).save(any(CodeTenantMapping.class));
    }

    // ================================================================
    // hide
    // ================================================================

    @Test
    @DisplayName("hide - success sets hidden")
    void hide_success_setsHidden() {
        // given
        CodeTenantMapping mapping = createTestMapping(MAPPING_ID, testCommonCode);

        when(codeTenantMappingRepository.findByTenantIdAndCodeId(TENANT_ID, CODE_ID))
            .thenReturn(Optional.of(mapping));
        when(codeTenantMappingRepository.save(any(CodeTenantMapping.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // when
        TenantCodeResponse result = tenantCodeService.hide(CODE_ID);

        // then
        assertThat(result).isNotNull();
        assertThat(result.isHidden()).isTrue();
        verify(codeTenantMappingRepository).save(any(CodeTenantMapping.class));
    }

    // ================================================================
    // resetToDefault
    // ================================================================

    @Test
    @DisplayName("resetToDefault - exists deletes mapping")
    void resetToDefault_exists_deletes() {
        // given
        CodeTenantMapping mapping = createTestMapping(MAPPING_ID, testCommonCode);

        when(codeTenantMappingRepository.findByTenantIdAndCodeId(TENANT_ID, CODE_ID))
            .thenReturn(Optional.of(mapping));

        // when
        tenantCodeService.resetToDefault(CODE_ID);

        // then
        verify(codeTenantMappingRepository).delete(mapping);
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
            .sortOrder(1)
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

    private CodeTenantMapping createTestMapping(UUID id, CommonCode commonCode) {
        CodeTenantMapping mapping = CodeTenantMapping.builder()
            .tenantId(TENANT_ID)
            .commonCode(commonCode)
            .hidden(false)
            .build();
        setEntityId(mapping, id);
        return mapping;
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
