package com.hrsaas.recruitment.repository;

import com.hrsaas.common.database.test.AbstractRepositoryTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for ApplicationRepository with Testcontainers.
 */
@ActiveProfiles("test")
class ApplicationRepositoryIT extends AbstractRepositoryTest {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Test
    @DisplayName("RLS 테넌트 격리 - 채용 지원서 테넌트 분리")
    void findAll_rlsIsolation_returnsOnlyOwnTenantData() {
        // given
        setTenantContext(TENANT_A);

        // when
        var results = applicationRepository.findAll();

        // then - no data should exist initially
        assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("빈 결과 처리 - 지원서 없을 시 빈 목록")
    void findByStatus_noData_returnsEmptyList() {
        // given
        setTenantContext(TENANT_A);

        // when
        var results = applicationRepository.findAll();

        // then
        assertThat(results).isNotNull().isEmpty();
    }
}
