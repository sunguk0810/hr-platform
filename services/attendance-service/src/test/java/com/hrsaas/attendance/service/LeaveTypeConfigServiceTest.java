package com.hrsaas.attendance.service;

import com.hrsaas.attendance.domain.entity.LeaveTypeConfig;
import com.hrsaas.attendance.repository.LeaveTypeConfigRepository;
import com.hrsaas.common.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LeaveTypeConfigService Tests")
class LeaveTypeConfigServiceTest {

    @Mock
    private LeaveTypeConfigRepository configRepository;

    @InjectMocks
    private LeaveTypeConfigService leaveTypeConfigService;

    private static final UUID TENANT_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("getActiveConfigs: returns only active configurations")
    void getActiveConfigs_returnsOnlyActive() {
        // given
        LeaveTypeConfig activeConfig1 = LeaveTypeConfig.builder()
                .tenantId(TENANT_ID)
                .code("ANNUAL")
                .name("Annual Leave")
                .isActive(true)
                .build();

        LeaveTypeConfig activeConfig2 = LeaveTypeConfig.builder()
                .tenantId(TENANT_ID)
                .code("SICK")
                .name("Sick Leave")
                .isActive(true)
                .build();

        when(configRepository.findActiveByTenantId(TENANT_ID))
                .thenReturn(List.of(activeConfig1, activeConfig2));

        // when
        List<LeaveTypeConfig> results = leaveTypeConfigService.getActiveConfigs();

        // then
        assertThat(results).hasSize(2);
        assertThat(results).extracting(LeaveTypeConfig::getCode)
                .containsExactly("ANNUAL", "SICK");
        assertThat(results).allMatch(LeaveTypeConfig::getIsActive);
        verify(configRepository).findActiveByTenantId(TENANT_ID);
    }

    @Test
    @DisplayName("create: valid config saves successfully")
    void create_validConfig_savesSuccessfully() {
        // given
        LeaveTypeConfig config = LeaveTypeConfig.builder()
                .tenantId(TENANT_ID)
                .code("MATERNITY")
                .name("Maternity Leave")
                .isPaid(true)
                .maxDaysPerYear(new BigDecimal("90"))
                .requiresApproval(true)
                .minNoticeDays(30)
                .allowHalfDay(false)
                .allowHourly(false)
                .deductFromAnnual(false)
                .genderRestriction("F")
                .isActive(true)
                .build();

        LeaveTypeConfig savedConfig = LeaveTypeConfig.builder()
                .tenantId(TENANT_ID)
                .code("MATERNITY")
                .name("Maternity Leave")
                .isPaid(true)
                .maxDaysPerYear(new BigDecimal("90"))
                .requiresApproval(true)
                .minNoticeDays(30)
                .allowHalfDay(false)
                .allowHourly(false)
                .deductFromAnnual(false)
                .genderRestriction("F")
                .isActive(true)
                .build();

        when(configRepository.save(any(LeaveTypeConfig.class))).thenReturn(savedConfig);

        // when
        LeaveTypeConfig result = leaveTypeConfigService.create(config);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getCode()).isEqualTo("MATERNITY");
        assertThat(result.getName()).isEqualTo("Maternity Leave");
        assertThat(result.getIsPaid()).isTrue();
        assertThat(result.getMaxDaysPerYear()).isEqualByComparingTo(new BigDecimal("90"));
        assertThat(result.getGenderRestriction()).isEqualTo("F");
        verify(configRepository).save(config);
    }

    @Test
    @DisplayName("create: duplicate code throws DataIntegrityViolationException")
    void create_duplicateCode_throwsException() {
        // given
        LeaveTypeConfig duplicateConfig = LeaveTypeConfig.builder()
                .tenantId(TENANT_ID)
                .code("ANNUAL")
                .name("Annual Leave Duplicate")
                .isActive(true)
                .build();

        // Unique constraint on (tenant_id, code) causes DataIntegrityViolationException
        when(configRepository.save(any(LeaveTypeConfig.class)))
                .thenThrow(new DataIntegrityViolationException(
                        "could not execute statement; SQL [n/a]; constraint [leave_type_config_tenant_id_code_key]"));

        // when & then
        assertThatThrownBy(() -> leaveTypeConfigService.create(duplicateConfig))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("constraint");

        verify(configRepository).save(duplicateConfig);
    }
}
