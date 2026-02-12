package com.hrsaas.mdm.service.impl;

import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.mdm.domain.dto.response.CodeExportResponse;
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

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CodeImportExportServiceBenchmarkTest {

    private static final UUID TENANT_ID = UUID.randomUUID();

    @Mock
    private CodeGroupRepository codeGroupRepository;

    @Mock
    private CommonCodeRepository commonCodeRepository;

    @InjectMocks
    private CodeImportExportServiceImpl codeImportExportService;

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Benchmark exportAll with many groups - demonstrates optimized calls")
    void benchmarkExportAll() {
        // Arrange
        int numGroups = 100;
        List<CodeGroup> groups = new ArrayList<>();
        List<CommonCode> allCodes = new ArrayList<>();

        for (int i = 0; i < numGroups; i++) {
            CodeGroup group = createTestCodeGroup(UUID.randomUUID(), "GROUP_" + i, "Group " + i);
            groups.add(group);
            allCodes.addAll(createCommonCodes(group, 5));
        }

        when(codeGroupRepository.findAllForTenant(TENANT_ID)).thenReturn(groups);

        // Mock the new method
        when(commonCodeRepository.findByCodeGroupIdIn(anyList())).thenReturn(allCodes);

        // Act
        long startTime = System.nanoTime();
        CodeExportResponse response = codeImportExportService.exportAll();
        long endTime = System.nanoTime();

        // Assert
        // Verify optimized behavior: findByCodeGroupIdIn is called once (batch size 1000 > 100 groups)
        verify(commonCodeRepository, times(1)).findByCodeGroupIdIn(anyList());
        // And ensure the old N+1 query is NOT called
        verify(commonCodeRepository, never()).findByCodeGroupId(any(UUID.class));

        System.out.println("Exported " + numGroups + " groups with 5 codes each.");
        System.out.println("Execution time (mocked DB): " + (endTime - startTime) / 1_000_000.0 + " ms");
        System.out.println("Repository calls: 1 (vs " + numGroups + " previously)");
    }

    private List<CommonCode> createCommonCodes(CodeGroup group, int count) {
        List<CommonCode> codes = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            CommonCode code = CommonCode.builder()
                .codeGroup(group)
                .tenantId(TENANT_ID)
                .code(group.getGroupCode() + "_CODE_" + i)
                .codeName("Code " + i)
                .build();
            codes.add(code);
        }
        return codes;
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
            Field idField = com.hrsaas.common.entity.BaseEntity.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(entity, id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
