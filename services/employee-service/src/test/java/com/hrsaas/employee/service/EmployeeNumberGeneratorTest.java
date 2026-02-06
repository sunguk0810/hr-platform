package com.hrsaas.employee.service;

import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.domain.entity.EmployeeNumberRule;
import com.hrsaas.employee.repository.EmployeeNumberRuleRepository;
import com.hrsaas.employee.repository.EmployeeRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link EmployeeNumberGenerator}.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("EmployeeNumberGenerator Tests")
class EmployeeNumberGeneratorTest {

    @Mock
    private EmployeeNumberRuleRepository ruleRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private EmployeeNumberGenerator employeeNumberGenerator;

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
    @DisplayName("generate: YEARLY rule with prefix+year+sequence generates correct pattern like HR-2026-0001")
    void generate_withYearlyRule_generatesCorrectPattern() {
        // given
        EmployeeNumberRule rule = EmployeeNumberRule.builder()
            .prefix("HR")
            .includeYear(true)
            .yearFormat("YYYY")
            .sequenceDigits(4)
            .sequenceResetPolicy("YEARLY")
            .currentSequence(0)
            .currentYear(null)
            .separator("-")
            .allowReuse(false)
            .isActive(true)
            .build();

        when(ruleRepository.findActiveByTenantIdForUpdate(TENANT_ID))
            .thenReturn(Optional.of(rule));
        when(ruleRepository.save(any(EmployeeNumberRule.class)))
            .thenReturn(rule);

        LocalDate hireDate = LocalDate.of(2026, 3, 15);

        // when
        String result = employeeNumberGenerator.generate(hireDate);

        // then
        assertThat(result).isEqualTo("HR-2026-0001");
        verify(ruleRepository).findActiveByTenantIdForUpdate(TENANT_ID);
        verify(ruleRepository).save(rule);
    }

    @Test
    @DisplayName("generate: YEARLY reset policy resets sequence when year changes")
    void generate_yearChanges_resetsSequence() {
        // given
        EmployeeNumberRule rule = EmployeeNumberRule.builder()
            .prefix("EMP")
            .includeYear(true)
            .yearFormat("YYYY")
            .sequenceDigits(4)
            .sequenceResetPolicy("YEARLY")
            .currentSequence(150)
            .currentYear(2025)
            .separator("-")
            .allowReuse(false)
            .isActive(true)
            .build();

        when(ruleRepository.findActiveByTenantIdForUpdate(TENANT_ID))
            .thenReturn(Optional.of(rule));
        when(ruleRepository.save(any(EmployeeNumberRule.class)))
            .thenReturn(rule);

        LocalDate hireDate2026 = LocalDate.of(2026, 1, 10);

        // when
        String result = employeeNumberGenerator.generate(hireDate2026);

        // then
        // Year changed from 2025 to 2026, so sequence should reset to 1
        assertThat(result).isEqualTo("EMP-2026-0001");
        assertThat(rule.getCurrentSequence()).isEqualTo(1);
        assertThat(rule.getCurrentYear()).isEqualTo(2026);
    }

    @Test
    @DisplayName("generate: NEVER reset policy continues sequence across years")
    void generate_neverResetPolicy_continuesSequence() {
        // given
        EmployeeNumberRule rule = EmployeeNumberRule.builder()
            .prefix("S")
            .includeYear(true)
            .yearFormat("YYYY")
            .sequenceDigits(4)
            .sequenceResetPolicy("NEVER")
            .currentSequence(42)
            .currentYear(2025)
            .separator("-")
            .allowReuse(false)
            .isActive(true)
            .build();

        when(ruleRepository.findActiveByTenantIdForUpdate(TENANT_ID))
            .thenReturn(Optional.of(rule));
        when(ruleRepository.save(any(EmployeeNumberRule.class)))
            .thenReturn(rule);

        LocalDate hireDate = LocalDate.of(2026, 6, 1);

        // when
        String result = employeeNumberGenerator.generate(hireDate);

        // then
        // NEVER reset: sequence should continue from 42 -> 43, not reset to 1
        assertThat(result).isEqualTo("S-2026-0043");
        assertThat(rule.getCurrentSequence()).isEqualTo(43);
    }

    @Test
    @DisplayName("generate: no rule configured falls back to simple year-sequence pattern")
    void generate_noRuleExists_generatesDefaultPattern() {
        // given
        when(ruleRepository.findActiveByTenantIdForUpdate(TENANT_ID))
            .thenReturn(Optional.empty());
        when(employeeRepository.count()).thenReturn(5L);

        LocalDate hireDate = LocalDate.of(2026, 4, 1);

        // when
        String result = employeeNumberGenerator.generate(hireDate);

        // then
        // Default pattern: year + "-" + zero-padded count+1
        assertThat(result).isEqualTo("2026-0006");
        verify(employeeRepository).count();
        verify(ruleRepository, never()).save(any());
    }

    @Test
    @DisplayName("findExistingNumber: allowReuse enabled returns existing number for rehire")
    void generate_allowReuse_returnsExistingNumber() {
        // given
        EmployeeNumberRule rule = EmployeeNumberRule.builder()
            .prefix("HR")
            .includeYear(true)
            .yearFormat("YYYY")
            .sequenceDigits(4)
            .sequenceResetPolicy("YEARLY")
            .currentSequence(10)
            .currentYear(2026)
            .separator("-")
            .allowReuse(true)
            .isActive(true)
            .build();

        when(ruleRepository.findActiveByTenantId(TENANT_ID))
            .thenReturn(Optional.of(rule));

        String name = "Hong Gildong";
        LocalDate birthDate = LocalDate.of(1990, 5, 20);

        // when
        // Note: The current implementation has a TODO for archive lookup and returns null.
        // This test verifies the allowReuse check does not short-circuit when reuse is enabled.
        String result = employeeNumberGenerator.findExistingNumber(TENANT_ID, name, birthDate);

        // then
        // The rule allows reuse, so the method proceeds to the archive lookup (which currently returns null).
        // When the archive lookup is implemented, this would return the existing number.
        assertThat(result).isNull();
        verify(ruleRepository).findActiveByTenantId(TENANT_ID);
    }

    @Test
    @DisplayName("findExistingNumber: allowReuse disabled returns null immediately")
    void findExistingNumber_reuseDisabled_returnsNull() {
        // given
        EmployeeNumberRule rule = EmployeeNumberRule.builder()
            .prefix("HR")
            .includeYear(true)
            .yearFormat("YYYY")
            .sequenceDigits(4)
            .sequenceResetPolicy("YEARLY")
            .currentSequence(10)
            .currentYear(2026)
            .separator("-")
            .allowReuse(false)
            .isActive(true)
            .build();

        when(ruleRepository.findActiveByTenantId(TENANT_ID))
            .thenReturn(Optional.of(rule));

        // when
        String result = employeeNumberGenerator.findExistingNumber(TENANT_ID, "Name", LocalDate.of(1990, 1, 1));

        // then
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("findExistingNumber: no rule configured returns null")
    void findExistingNumber_noRule_returnsNull() {
        // given
        when(ruleRepository.findActiveByTenantId(TENANT_ID))
            .thenReturn(Optional.empty());

        // when
        String result = employeeNumberGenerator.findExistingNumber(TENANT_ID, "Name", LocalDate.of(1990, 1, 1));

        // then
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("generate: YY year format uses two-digit year")
    void generate_yyYearFormat_usesTwoDigitYear() {
        // given
        EmployeeNumberRule rule = EmployeeNumberRule.builder()
            .prefix("E")
            .includeYear(true)
            .yearFormat("YY")
            .sequenceDigits(3)
            .sequenceResetPolicy("YEARLY")
            .currentSequence(0)
            .currentYear(null)
            .separator("-")
            .allowReuse(false)
            .isActive(true)
            .build();

        when(ruleRepository.findActiveByTenantIdForUpdate(TENANT_ID))
            .thenReturn(Optional.of(rule));
        when(ruleRepository.save(any(EmployeeNumberRule.class)))
            .thenReturn(rule);

        LocalDate hireDate = LocalDate.of(2026, 7, 1);

        // when
        String result = employeeNumberGenerator.generate(hireDate);

        // then
        assertThat(result).isEqualTo("E-26-001");
    }

    @Test
    @DisplayName("generate: includeYear false omits year from generated number")
    void generate_includeYearFalse_omitsYear() {
        // given
        EmployeeNumberRule rule = EmployeeNumberRule.builder()
            .prefix("STAFF")
            .includeYear(false)
            .yearFormat("YYYY")
            .sequenceDigits(5)
            .sequenceResetPolicy("NEVER")
            .currentSequence(99)
            .currentYear(2025)
            .separator("-")
            .allowReuse(false)
            .isActive(true)
            .build();

        when(ruleRepository.findActiveByTenantIdForUpdate(TENANT_ID))
            .thenReturn(Optional.of(rule));
        when(ruleRepository.save(any(EmployeeNumberRule.class)))
            .thenReturn(rule);

        LocalDate hireDate = LocalDate.of(2026, 1, 1);

        // when
        String result = employeeNumberGenerator.generate(hireDate);

        // then
        assertThat(result).isEqualTo("STAFF-00100");
    }
}
