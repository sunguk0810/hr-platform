package com.hrsaas.mdm.service.impl;

import com.hrsaas.common.entity.BaseEntity;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.mdm.domain.dto.response.CodeImpactResponse;
import com.hrsaas.mdm.domain.entity.CodeGroup;
import com.hrsaas.mdm.domain.entity.CodeUsageMapping;
import com.hrsaas.mdm.domain.entity.CommonCode;
import com.hrsaas.mdm.repository.CodeTenantMappingRepository;
import com.hrsaas.mdm.repository.CodeUsageMappingRepository;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CodeImpactAnalyzerImplTest {

    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final UUID CODE_GROUP_ID = UUID.randomUUID();
    private static final UUID CODE_ID = UUID.randomUUID();

    @Mock
    private CommonCodeRepository commonCodeRepository;

    @Mock
    private CodeTenantMappingRepository codeTenantMappingRepository;

    @Mock
    private CodeUsageMappingRepository codeUsageMappingRepository;

    @InjectMocks
    private CodeImpactAnalyzerImpl codeImpactAnalyzer;

    private CodeGroup leaveTypeGroup;
    private CommonCode testCode;

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_ID);
        leaveTypeGroup = createTestCodeGroup(CODE_GROUP_ID, "LEAVE_TYPE");
        testCode = createTestCode(CODE_ID, leaveTypeGroup, "ANNUAL", "연차");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // ================================================================
    // analyzeImpact
    // ================================================================

    @Test
    @DisplayName("analyzeImpact - code with children calculates score")
    void analyzeImpact_codeWithChildren_calculatesScore() {
        // given
        UUID childId = UUID.randomUUID();
        CommonCode childCode = createTestCode(childId, leaveTypeGroup, "ANNUAL_HALF", "반차");
        childCode.setParentCodeId(CODE_ID);

        List<CodeUsageMapping> usageMappings = List.of(
            CodeUsageMapping.builder()
                .groupCode("LEAVE_TYPE").resourceType("TABLE").resourceName("leave_request").description("휴가 신청 테이블").build(),
            CodeUsageMapping.builder()
                .groupCode("LEAVE_TYPE").resourceType("TABLE").resourceName("leave_balance").description("휴가 잔여 테이블").build(),
            CodeUsageMapping.builder()
                .groupCode("LEAVE_TYPE").resourceType("SERVICE").resourceName("attendance-service").description("근태 관리 서비스").build()
        );

        when(commonCodeRepository.findById(CODE_ID)).thenReturn(Optional.of(testCode));
        when(commonCodeRepository.findActiveByTenantId(TENANT_ID)).thenReturn(List.of(testCode, childCode));
        when(codeTenantMappingRepository.existsByTenantIdAndCommonCodeId(TENANT_ID, CODE_ID)).thenReturn(false);
        when(codeUsageMappingRepository.findByGroupCode("LEAVE_TYPE")).thenReturn(usageMappings);

        // when
        CodeImpactResponse result = codeImpactAnalyzer.analyzeImpact(CODE_ID);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getCodeId()).isEqualTo(CODE_ID);
        assertThat(result.getGroupCode()).isEqualTo("LEAVE_TYPE");
        assertThat(result.getChildCodeCount()).isEqualTo(1);
        assertThat(result.getImpactedResources()).hasSize(3);
        // Score: childCount(1)*10 = 10 + tenantMapping(0)*15 = 0 + resources(3)*10 = 30 => total 40
        assertThat(result.getImpactScore()).isEqualTo(40);
        assertThat(result.getImpactLevel()).isEqualTo(CodeImpactResponse.ImpactLevel.MEDIUM);
    }

    // ================================================================
    // analyzeDeletionImpact
    // ================================================================

    @Test
    @DisplayName("analyzeDeletionImpact - with children adds recommendation")
    void analyzeDeletionImpact_withChildren_addsRecommendation() {
        // given
        UUID childId = UUID.randomUUID();
        CommonCode childCode = createTestCode(childId, leaveTypeGroup, "ANNUAL_HALF", "반차");
        childCode.setParentCodeId(CODE_ID);

        List<CodeUsageMapping> usageMappings = List.of(
            CodeUsageMapping.builder()
                .groupCode("LEAVE_TYPE").resourceType("TABLE").resourceName("leave_request").description("휴가 신청 테이블").build(),
            CodeUsageMapping.builder()
                .groupCode("LEAVE_TYPE").resourceType("TABLE").resourceName("leave_balance").description("휴가 잔여 테이블").build(),
            CodeUsageMapping.builder()
                .groupCode("LEAVE_TYPE").resourceType("SERVICE").resourceName("attendance-service").description("근태 관리 서비스").build()
        );

        when(commonCodeRepository.findById(CODE_ID)).thenReturn(Optional.of(testCode));
        when(commonCodeRepository.findActiveByTenantId(TENANT_ID)).thenReturn(List.of(testCode, childCode));
        when(codeTenantMappingRepository.existsByTenantIdAndCommonCodeId(TENANT_ID, CODE_ID)).thenReturn(false);
        when(codeUsageMappingRepository.findByGroupCode("LEAVE_TYPE")).thenReturn(usageMappings);

        // when
        CodeImpactResponse result = codeImpactAnalyzer.analyzeDeletionImpact(CODE_ID);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getChildCodeCount()).isEqualTo(1);
        assertThat(result.getRecommendations())
            .anyMatch(r -> r.contains("하위 코드가 존재합니다"));
        // Deletion adds +20 to impact score: base 40 + 20 = 60
        assertThat(result.getImpactScore()).isEqualTo(60);
    }

    // ================================================================
    // analyzeDeprecationImpact
    // ================================================================

    @Test
    @DisplayName("analyzeDeprecationImpact - returns recommendations")
    void analyzeDeprecationImpact_returnsRecommendations() {
        // given
        List<CodeUsageMapping> usageMappings = List.of(
            CodeUsageMapping.builder()
                .groupCode("LEAVE_TYPE").resourceType("TABLE").resourceName("leave_request").description("휴가 신청 테이블").build()
        );

        when(commonCodeRepository.findById(CODE_ID)).thenReturn(Optional.of(testCode));
        when(commonCodeRepository.findActiveByTenantId(TENANT_ID)).thenReturn(List.of(testCode));
        when(codeTenantMappingRepository.existsByTenantIdAndCommonCodeId(TENANT_ID, CODE_ID)).thenReturn(false);
        when(codeUsageMappingRepository.findByGroupCode("LEAVE_TYPE")).thenReturn(usageMappings);

        // when
        CodeImpactResponse result = codeImpactAnalyzer.analyzeDeprecationImpact(CODE_ID);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getRecommendations())
            .anyMatch(r -> r.contains("코드 폐기 시 신규 사용이 제한됩니다"));
        assertThat(result.getRecommendations())
            .anyMatch(r -> r.contains("기존 데이터는 유지되나"));
        // Has impacted resources, so migration recommendation should appear
        assertThat(result.getRecommendations())
            .anyMatch(r -> r.contains("대체 코드를 지정하고 마이그레이션을 계획하세요"));
    }

    // ================================================================
    // canDelete
    // ================================================================

    @Test
    @DisplayName("canDelete - with children returns false")
    void canDelete_withChildren_returnsFalse() {
        // given
        UUID childId = UUID.randomUUID();
        CommonCode childCode = createTestCode(childId, leaveTypeGroup, "ANNUAL_HALF", "반차");
        childCode.setParentCodeId(CODE_ID);

        when(commonCodeRepository.findById(CODE_ID)).thenReturn(Optional.of(testCode));
        when(commonCodeRepository.findActiveByTenantId(TENANT_ID)).thenReturn(List.of(testCode, childCode));
        when(codeTenantMappingRepository.existsByTenantIdAndCommonCodeId(TENANT_ID, CODE_ID)).thenReturn(false);
        when(codeUsageMappingRepository.findByGroupCode("LEAVE_TYPE")).thenReturn(Collections.emptyList());

        // when
        boolean result = codeImpactAnalyzer.canDelete(CODE_ID);

        // then
        assertThat(result).isFalse();
    }

    // ================================================================
    // canChangeStatus
    // ================================================================

    @Test
    @DisplayName("canChangeStatus - low impact returns true")
    void canChangeStatus_lowImpact_returnsTrue() {
        // given -- use a group code with no usage mappings
        CodeGroup customGroup = createTestCodeGroup(UUID.randomUUID(), "CUSTOM_TYPE");
        CommonCode customCode = createTestCode(CODE_ID, customGroup, "TYPE_A", "유형A");

        when(commonCodeRepository.findById(CODE_ID)).thenReturn(Optional.of(customCode));
        when(commonCodeRepository.findActiveByTenantId(TENANT_ID)).thenReturn(List.of(customCode));
        when(codeTenantMappingRepository.existsByTenantIdAndCommonCodeId(TENANT_ID, CODE_ID)).thenReturn(false);
        when(codeUsageMappingRepository.findByGroupCode("CUSTOM_TYPE")).thenReturn(Collections.emptyList());

        // when
        boolean result = codeImpactAnalyzer.canChangeStatus(CODE_ID);

        // then
        // No children, no tenant mappings, no impacted resources => score = 0 => LOW => canChangeStatus = true
        assertThat(result).isTrue();
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
