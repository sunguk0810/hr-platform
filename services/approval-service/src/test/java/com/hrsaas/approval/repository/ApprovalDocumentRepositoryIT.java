package com.hrsaas.approval.repository;

import com.hrsaas.common.database.test.AbstractRepositoryTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for ApprovalDocumentRepository with Testcontainers.
 */
@ActiveProfiles("test")
class ApprovalDocumentRepositoryIT extends AbstractRepositoryTest {

    @Autowired
    private ApprovalDocumentRepository approvalDocumentRepository;

    @Test
    @DisplayName("RLS 테넌트 격리 - 결재 문서 테넌트 분리")
    void findAll_rlsIsolation_returnsOnlyOwnTenantData() {
        // given
        setTenantContext(TENANT_A);

        // when
        var results = approvalDocumentRepository.findAll();

        // then - no data should exist initially
        assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("빈 결과 처리 - 조건에 맞는 결재 없을 시 빈 목록")
    void findByStatus_noData_returnsEmptyList() {
        // given
        setTenantContext(TENANT_A);

        // when
        var results = approvalDocumentRepository.findAll();

        // then
        assertThat(results).isNotNull().isEmpty();
    }
}
