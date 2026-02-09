package com.hrsaas.mdm.service.impl;

import com.hrsaas.common.entity.BaseEntity;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.mdm.domain.dto.request.CodeSearchRequest;
import com.hrsaas.mdm.domain.dto.response.SimilarCodeResponse;
import com.hrsaas.mdm.domain.entity.CodeGroup;
import com.hrsaas.mdm.domain.entity.CommonCode;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CodeSearchServiceImplTest {

    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final UUID CODE_GROUP_ID = UUID.randomUUID();

    @Mock
    private CommonCodeRepository commonCodeRepository;

    @InjectMocks
    private CodeSearchServiceImpl codeSearchService;

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
    // calculateLevenshteinDistance
    // ================================================================

    @Test
    @DisplayName("calculateLevenshteinDistance - same strings returns zero")
    void calculateLevenshteinDistance_sameStrings_returnsZero() {
        // when
        int distance = codeSearchService.calculateLevenshteinDistance("hello", "hello");

        // then
        assertThat(distance).isZero();
    }

    @Test
    @DisplayName("calculateLevenshteinDistance - different strings returns correct distance")
    void calculateLevenshteinDistance_differentStrings_returnsCorrect() {
        // when
        int distance = codeSearchService.calculateLevenshteinDistance("kitten", "sitting");

        // then
        // kitten -> sitten (substitution) -> sittin (substitution) -> sitting (insertion) = 3
        assertThat(distance).isEqualTo(3);
    }

    // ================================================================
    // calculateSimilarity
    // ================================================================

    @Test
    @DisplayName("calculateSimilarity - exact match returns one")
    void calculateSimilarity_exactMatch_returnsOne() {
        // when
        double similarity = codeSearchService.calculateSimilarity("연차", "연차");

        // then
        assertThat(similarity).isEqualTo(1.0);
    }

    // ================================================================
    // searchSimilar
    // ================================================================

    @Test
    @DisplayName("searchSimilar - with results returns sorted by similarity descending")
    void searchSimilar_withResults_returnsSorted() {
        // given
        CommonCode code1 = createTestCode(UUID.randomUUID(), testCodeGroup, "ANNUAL", "연차");
        CommonCode code2 = createTestCode(UUID.randomUUID(), testCodeGroup, "SICK", "병가");
        CommonCode code3 = createTestCode(UUID.randomUUID(), testCodeGroup, "ANNUAL_LEAVE", "연차휴가");

        when(commonCodeRepository.findByGroupCode("LEAVE_TYPE", TENANT_ID))
            .thenReturn(List.of(code1, code2, code3));

        CodeSearchRequest request = CodeSearchRequest.builder()
            .keyword("연차")
            .groupCode("LEAVE_TYPE")
            .similarityThreshold(0.3)
            .maxResults(10)
            .activeOnly(false)
            .build();

        // when
        List<SimilarCodeResponse> result = codeSearchService.searchSimilar(request);

        // then
        assertThat(result).isNotEmpty();
        // Results should be sorted by similarity descending
        for (int i = 0; i < result.size() - 1; i++) {
            assertThat(result.get(i).getSimilarity())
                .isGreaterThanOrEqualTo(result.get(i + 1).getSimilarity());
        }
    }

    // ================================================================
    // checkDuplicate
    // ================================================================

    @Test
    @DisplayName("checkDuplicate - high similarity returns duplicates")
    void checkDuplicate_highSimilarity_returnsDuplicates() {
        // given
        CommonCode code1 = createTestCode(UUID.randomUUID(), testCodeGroup, "ANNUAL", "연차");
        CommonCode code2 = createTestCode(UUID.randomUUID(), testCodeGroup, "ANNUAL_LEAVE", "연차휴가");

        when(commonCodeRepository.findByGroupCode("LEAVE_TYPE", TENANT_ID))
            .thenReturn(List.of(code1, code2));

        // when -- searching for "연차" which is identical to code1's codeName
        List<SimilarCodeResponse> result = codeSearchService.checkDuplicate("LEAVE_TYPE", "연차");

        // then
        assertThat(result).isNotEmpty();
        // "연차" vs "연차" should be an exact match (similarity = 1.0) which is >= 0.85 threshold
        assertThat(result.get(0).getSimilarity()).isGreaterThanOrEqualTo(0.85);
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
