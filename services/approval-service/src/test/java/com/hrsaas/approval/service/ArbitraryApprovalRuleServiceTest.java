package com.hrsaas.approval.service;

import com.hrsaas.approval.domain.entity.ArbitraryApprovalRule;
import com.hrsaas.approval.repository.ArbitraryApprovalRuleRepository;
import com.hrsaas.common.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ArbitraryApprovalRuleService.
 * Tests rule evaluation logic and CRUD operations with mocked repository and tenant context.
 */
@ExtendWith(MockitoExtension.class)
class ArbitraryApprovalRuleServiceTest {

    @Mock
    private ArbitraryApprovalRuleRepository ruleRepository;

    @InjectMocks
    private ArbitraryApprovalRuleService arbitraryApprovalRuleService;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        TenantContext.setCurrentTenant(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("evaluateRules: amount less than condition value matches rule")
    void evaluateRules_amountLessThan_matchesRule() {
        // Given: an active rule with condition AMOUNT < 1000000
        String documentType = "LEAVE_REQUEST";
        ArbitraryApprovalRule rule = ArbitraryApprovalRule.builder()
            .documentType(documentType)
            .conditionType("AMOUNT")
            .conditionOperator("LT")
            .conditionValue("1000000")
            .skipToSequence(2)
            .isActive(true)
            .description("Amount less than 1M allows arbitrary approval")
            .build();

        when(ruleRepository.findActiveRules(eq(tenantId), eq(documentType)))
            .thenReturn(List.of(rule));

        Map<String, String> conditions = Map.of("AMOUNT", "500000");

        // When
        Optional<ArbitraryApprovalRule> result = arbitraryApprovalRuleService.evaluateRules(documentType, conditions);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getConditionType()).isEqualTo("AMOUNT");
        assertThat(result.get().getConditionOperator()).isEqualTo("LT");
        assertThat(result.get().getConditionValue()).isEqualTo("1000000");
        assertThat(result.get().getSkipToSequence()).isEqualTo(2);
        verify(ruleRepository).findActiveRules(tenantId, documentType);
    }

    @Test
    @DisplayName("evaluateRules: no matching rules returns empty optional")
    void evaluateRules_noMatchingRules_returnsEmpty() {
        // Given: an active rule with condition AMOUNT < 1000000, but actual amount exceeds it
        String documentType = "LEAVE_REQUEST";
        ArbitraryApprovalRule rule = ArbitraryApprovalRule.builder()
            .documentType(documentType)
            .conditionType("AMOUNT")
            .conditionOperator("LT")
            .conditionValue("1000000")
            .skipToSequence(2)
            .isActive(true)
            .build();

        when(ruleRepository.findActiveRules(eq(tenantId), eq(documentType)))
            .thenReturn(List.of(rule));

        // Actual amount is 2000000, which is NOT less than 1000000
        Map<String, String> conditions = Map.of("AMOUNT", "2000000");

        // When
        Optional<ArbitraryApprovalRule> result = arbitraryApprovalRuleService.evaluateRules(documentType, conditions);

        // Then
        assertThat(result).isEmpty();
        verify(ruleRepository).findActiveRules(tenantId, documentType);
    }

    @Test
    @DisplayName("create: valid rule is saved and returned")
    void create_validRule_savesAndReturns() {
        // Given: a valid arbitrary approval rule
        ArbitraryApprovalRule rule = ArbitraryApprovalRule.builder()
            .documentType("EXPENSE_REPORT")
            .conditionType("AMOUNT")
            .conditionOperator("LTE")
            .conditionValue("500000")
            .skipToSequence(3)
            .isActive(true)
            .description("Expense under 500K")
            .build();

        when(ruleRepository.save(any(ArbitraryApprovalRule.class))).thenReturn(rule);

        // When
        ArbitraryApprovalRule result = arbitraryApprovalRuleService.create(rule);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getDocumentType()).isEqualTo("EXPENSE_REPORT");
        assertThat(result.getConditionType()).isEqualTo("AMOUNT");
        assertThat(result.getConditionOperator()).isEqualTo("LTE");
        assertThat(result.getConditionValue()).isEqualTo("500000");
        assertThat(result.getSkipToSequence()).isEqualTo(3);
        assertThat(result.getIsActive()).isTrue();
        verify(ruleRepository).save(rule);
    }
}
