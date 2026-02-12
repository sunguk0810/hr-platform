package com.hrsaas.mdm.service.impl;

import com.hrsaas.common.entity.BaseEntity;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.mdm.domain.dto.request.CodeImportBatchRequest;
import com.hrsaas.mdm.domain.dto.request.CodeImportRequest;
import com.hrsaas.mdm.domain.dto.response.CodeExportResponse;
import com.hrsaas.mdm.domain.dto.response.ImportResultResponse;
import com.hrsaas.mdm.domain.entity.CodeGroup;
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
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CodeImportExportServiceImplTest {

    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final UUID CODE_GROUP_ID = UUID.randomUUID();

    @Mock
    private CodeGroupRepository codeGroupRepository;

    @Mock
    private CommonCodeRepository commonCodeRepository;

    @InjectMocks
    private CodeImportExportServiceImpl codeImportExportService;

    private CodeGroup testCodeGroup;

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_ID);
        testCodeGroup = createTestCodeGroup(CODE_GROUP_ID, "LEAVE_TYPE", "휴가 유형");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // ================================================================
    // importCodes - new codes
    // ================================================================

    @Test
    @DisplayName("importCodes - new codes creates successfully")
    void importCodes_newCodes_createsSuccessfully() {
        // given
        CodeImportRequest codeRequest = CodeImportRequest.builder()
            .groupCode("LEAVE_TYPE")
            .code("ANNUAL")
            .codeName("연차")
            .build();

        CodeImportBatchRequest request = CodeImportBatchRequest.builder()
            .codes(List.of(codeRequest))
            .overwrite(false)
            .validateOnly(false)
            .build();

        // Optimized calls
        when(codeGroupRepository.findByGroupCodeInAndTenantId(anyCollection(), eq(TENANT_ID)))
            .thenReturn(List.of(testCodeGroup));
        when(commonCodeRepository.findByCodeGroupIdIn(anyList()))
            .thenReturn(Collections.emptyList());
        when(commonCodeRepository.saveAll(anyCollection()))
            .thenAnswer(invocation -> {
                java.util.Collection<?> arg = invocation.getArgument(0);
                return new java.util.ArrayList<>(arg);
            });

        // when
        ImportResultResponse result = codeImportExportService.importCodes(request);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getCodesCreated()).isEqualTo(1);
        assertThat(result.getCodesSkipped()).isZero();
        assertThat(result.isSuccess()).isTrue();
        verify(commonCodeRepository).saveAll(anyCollection());
    }

    // ================================================================
    // importCodes - existing with overwrite
    // ================================================================

    @Test
    @DisplayName("importCodes - existing with overwrite updates")
    void importCodes_existingWithOverwrite_updates() {
        // given
        CommonCode existingCode = createTestCode(UUID.randomUUID(), testCodeGroup, "ANNUAL", "연차");

        CodeImportRequest codeRequest = CodeImportRequest.builder()
            .groupCode("LEAVE_TYPE")
            .code("ANNUAL")
            .codeName("연차휴가 (수정)")
            .build();

        CodeImportBatchRequest request = CodeImportBatchRequest.builder()
            .codes(List.of(codeRequest))
            .overwrite(true)
            .validateOnly(false)
            .build();

        // Optimized calls
        when(codeGroupRepository.findByGroupCodeInAndTenantId(anyCollection(), eq(TENANT_ID)))
            .thenReturn(List.of(testCodeGroup));
        when(commonCodeRepository.findByCodeGroupIdIn(anyList()))
            .thenReturn(List.of(existingCode));
        when(commonCodeRepository.saveAll(anyCollection()))
            .thenAnswer(invocation -> {
                java.util.Collection<?> arg = invocation.getArgument(0);
                return new java.util.ArrayList<>(arg);
            });

        // when
        ImportResultResponse result = codeImportExportService.importCodes(request);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getCodesUpdated()).isEqualTo(1);
        assertThat(result.getCodesCreated()).isZero();
        assertThat(result.isSuccess()).isTrue();
        verify(commonCodeRepository).saveAll(anyCollection());
    }

    // ================================================================
    // importCodes - existing without overwrite
    // ================================================================

    @Test
    @DisplayName("importCodes - existing without overwrite skips")
    void importCodes_existingWithoutOverwrite_skips() {
        // given
        CommonCode existingCode = createTestCode(UUID.randomUUID(), testCodeGroup, "ANNUAL", "연차");

        CodeImportRequest codeRequest = CodeImportRequest.builder()
            .groupCode("LEAVE_TYPE")
            .code("ANNUAL")
            .codeName("연차")
            .build();

        CodeImportBatchRequest request = CodeImportBatchRequest.builder()
            .codes(List.of(codeRequest))
            .overwrite(false)
            .validateOnly(false)
            .build();

        // Optimized calls
        when(codeGroupRepository.findByGroupCodeInAndTenantId(anyCollection(), eq(TENANT_ID)))
            .thenReturn(List.of(testCodeGroup));
        when(commonCodeRepository.findByCodeGroupIdIn(anyList()))
            .thenReturn(List.of(existingCode));

        // when
        ImportResultResponse result = codeImportExportService.importCodes(request);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getCodesSkipped()).isEqualTo(1);
        assertThat(result.getCodesCreated()).isZero();
        assertThat(result.getCodesUpdated()).isZero();

        // Assert warnings
        assertThat(result.getWarnings()).isNotEmpty();
    }

    // ================================================================
    // validateImport - missing fields
    // ================================================================

    @Test
    @DisplayName("validateImport - missing fields returns errors")
    void validateImport_missingFields_returnsErrors() {
        // given
        CodeImportRequest codeWithMissingGroupCode = CodeImportRequest.builder()
            .groupCode("")  // empty group code
            .code("ANNUAL")
            .codeName("연차")
            .build();

        CodeImportRequest codeWithMissingCode = CodeImportRequest.builder()
            .groupCode("LEAVE_TYPE")
            .code("")  // empty code
            .codeName("연차")
            .build();

        CodeImportRequest codeWithMissingCodeName = CodeImportRequest.builder()
            .groupCode("LEAVE_TYPE")
            .code("ANNUAL")
            .codeName("")  // empty code name
            .build();

        CodeImportBatchRequest request = CodeImportBatchRequest.builder()
            .codes(List.of(codeWithMissingGroupCode, codeWithMissingCode, codeWithMissingCodeName))
            .overwrite(false)
            .validateOnly(true)
            .build();

        // when
        ImportResultResponse result = codeImportExportService.validateImport(request);

        // then
        assertThat(result).isNotNull();
        assertThat(result.hasErrors()).isTrue();
        assertThat(result.getErrors()).hasSize(3);
    }

    // ================================================================
    // exportAll
    // ================================================================

    @Test
    @DisplayName("exportAll - returns export data")
    void exportAll_returnsExportData() {
        // given
        CommonCode code1 = createTestCode(UUID.randomUUID(), testCodeGroup, "ANNUAL", "연차");
        CommonCode code2 = createTestCode(UUID.randomUUID(), testCodeGroup, "SICK", "병가");

        when(codeGroupRepository.findAllForTenant(TENANT_ID)).thenReturn(List.of(testCodeGroup));
        when(commonCodeRepository.findByCodeGroupIdIn(anyList())).thenReturn(List.of(code1, code2));

        // when
        CodeExportResponse result = codeImportExportService.exportAll();

        // then
        assertThat(result).isNotNull();
        assertThat(result.getExportVersion()).isEqualTo("1.0");
        assertThat(result.getTotalGroups()).isEqualTo(1);
        assertThat(result.getTotalCodes()).isEqualTo(2);
        assertThat(result.getGroups()).hasSize(1);
        assertThat(result.getGroups().get(0).getGroupCode()).isEqualTo("LEAVE_TYPE");
        assertThat(result.getGroups().get(0).getCodes()).hasSize(2);
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

    private CodeGroup createTestCodeGroup(UUID id, String groupCode, String groupName) {
        CodeGroup codeGroup = CodeGroup.builder()
            .tenantId(TENANT_ID)
            .groupCode(groupCode)
            .groupName(groupName)
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
