package com.hrsaas.mdm.service.impl;

import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.mdm.domain.entity.CodeGroup;
import com.hrsaas.mdm.repository.CodeGroupRepository;
import com.hrsaas.mdm.repository.CommonCodeRepository;
import com.hrsaas.mdm.service.CodeImportExportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExcelCodeImportExportServiceImplTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock
    private CodeGroupRepository codeGroupRepository;

    @Mock
    private CommonCodeRepository commonCodeRepository;

    @Mock
    private CodeImportExportService codeImportExportService;

    @InjectMocks
    private ExcelCodeImportExportServiceImpl excelCodeImportExportService;

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_ID);
    }

    @Test
    @DisplayName("exportToExcel uses single query for all groups")
    void exportToExcel_usesSingleQuery() {
        // given
        CodeGroup group1 = CodeGroup.builder()
            .tenantId(TENANT_ID)
            .groupCode("G1")
            .groupName("Group 1")
            .build();
        setEntityId(group1, UUID.randomUUID());

        CodeGroup group2 = CodeGroup.builder()
            .tenantId(TENANT_ID)
            .groupCode("G2")
            .groupName("Group 2")
            .build();
        setEntityId(group2, UUID.randomUUID());

        when(codeGroupRepository.findAllForTenant(TENANT_ID)).thenReturn(List.of(group1, group2));

        // Mock empty codes for the single bulk query
        when(commonCodeRepository.findByCodeGroupIdIn(anyList())).thenReturn(List.of());

        // when
        excelCodeImportExportService.exportToExcel(null);

        // then
        // Verify findByCodeGroupIdIn is called once
        verify(commonCodeRepository, times(1)).findByCodeGroupIdIn(anyList());

        // Verify findByCodeGroupId is NEVER called
        verify(commonCodeRepository, never()).findByCodeGroupId(any(UUID.class));
    }

    private void setEntityId(Object entity, UUID id) {
        try {
            // Traverse up to find the field in BaseEntity
            Class<?> clazz = entity.getClass();
            while (clazz != null) {
                try {
                    java.lang.reflect.Field idField = clazz.getDeclaredField("id");
                    idField.setAccessible(true);
                    idField.set(entity, id);
                    return;
                } catch (NoSuchFieldException e) {
                    clazz = clazz.getSuperclass();
                }
            }
            throw new RuntimeException("Could not find field 'id' in class hierarchy of " + entity.getClass().getName());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
