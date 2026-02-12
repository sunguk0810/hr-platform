package com.hrsaas.mdm.service.impl;

import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.mdm.domain.dto.request.CodeImportBatchRequest;
import com.hrsaas.mdm.domain.dto.request.CodeImportRequest;
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

import java.lang.reflect.Field;
import java.util.*;
import java.util.stream.Collectors;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CodeImportExportServiceRegressionTest {

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
    @DisplayName("Verify Optimized Import - Bulk fetches used")
    void testImportCodes_Optimized() {
        // Arrange
        int numGroups = 10;
        int codesPerGroup = 5;
        int totalRequests = numGroups * codesPerGroup;

        List<CodeImportRequest> requests = new ArrayList<>();
        List<CodeGroup> groups = new ArrayList<>();
        List<CommonCode> existingCodes = new ArrayList<>();

        for (int i = 0; i < numGroups; i++) {
            String groupCode = "GROUP_" + i;
            CodeGroup group = createTestCodeGroup(UUID.randomUUID(), groupCode, "Group " + i);
            groups.add(group);

            for (int j = 0; j < codesPerGroup; j++) {
                requests.add(CodeImportRequest.builder()
                    .groupCode(groupCode)
                    .groupName("Group " + i)
                    .code("CODE_" + j)
                    .codeName("Code Name " + j)
                    .sortOrder(j)
                    .build());
            }
        }

        CodeImportBatchRequest batchRequest = new CodeImportBatchRequest();
        batchRequest.setCodes(requests);
        batchRequest.setOverwrite(true);

        // Mock NEW bulk methods
        when(codeGroupRepository.findByGroupCodeInAndTenantId(anyCollection(), eq(TENANT_ID)))
            .thenReturn(groups);

        when(commonCodeRepository.findByCodeGroupIdIn(anyList()))
            .thenReturn(existingCodes); // Empty list simulating no existing codes

        // Act
        ImportResultResponse response = codeImportExportService.importCodes(batchRequest);

        // Assert
        // Verify OLD methods are NOT called (or rarely called)
        // findByGroupCodeAndTenant was called N times before. Now should be 0.
        // Wait, validateImport still calls it? We called importCodes.
        // importCodes calls findByGroupCodeIn... once.
        verify(codeGroupRepository, times(1)).findByGroupCodeInAndTenantId(anyCollection(), eq(TENANT_ID));
        verify(codeGroupRepository, never()).findByGroupCodeAndTenant(anyString(), any(UUID.class));

        // findByCodeGroupId was called N times before. Now should be 0.
        verify(commonCodeRepository, never()).findByCodeGroupId(any(UUID.class));

        // findByCodeGroupIdIn should be called once (since < 500 groups)
        verify(commonCodeRepository, times(1)).findByCodeGroupIdIn(anyList());

        // And saveAll should be called for codes
        verify(commonCodeRepository, times(1)).saveAll(anyCollection());
        // And save for groups? No new groups in this test setup (they exist).
        verify(codeGroupRepository, never()).saveAll(anyList());

        // Check result
        assert response.getTotalRequested() == totalRequests;
        assert response.getCodesCreated() == totalRequests; // All new
    }

    @Test
    @DisplayName("Verify Optimized Import with New Groups")
    void testImportCodes_WithNewGroups() {
        // Arrange
        List<CodeImportRequest> requests = new ArrayList<>();
        requests.add(CodeImportRequest.builder()
            .groupCode("NEW_GROUP")
            .groupName("New Group")
            .code("C1")
            .codeName("C1 Name")
            .build());

        CodeImportBatchRequest batchRequest = new CodeImportBatchRequest();
        batchRequest.setCodes(requests);

        // Mock existing groups returns empty
        when(codeGroupRepository.findByGroupCodeInAndTenantId(anyCollection(), any()))
            .thenReturn(Collections.emptyList());

        // Mock saveAll for groups to return groups with IDs
        when(codeGroupRepository.saveAll(anyList())).thenAnswer(invocation -> {
            List<CodeGroup> input = invocation.getArgument(0);
            input.forEach(g -> setEntityId(g, UUID.randomUUID()));
            return input;
        });

        // Act
        ImportResultResponse response = codeImportExportService.importCodes(batchRequest);

        // Assert
        verify(codeGroupRepository, times(1)).saveAll(anyList());
        verify(commonCodeRepository, times(1)).saveAll(anyCollection());

        assert response.getGroupsCreated() == 1;
        assert response.getCodesCreated() == 1;
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
             try {
                Field idField = entity.getClass().getSuperclass().getDeclaredField("id");
                idField.setAccessible(true);
                idField.set(entity, id);
            } catch (Exception ex) {}
        }
    }
}
