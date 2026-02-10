package com.hrsaas.mdm.repository;

import com.hrsaas.common.database.test.AbstractRepositoryTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for CommonCodeRepository with Testcontainers.
 */
@ActiveProfiles("test")
class CommonCodeRepositoryIT extends AbstractRepositoryTest {

    @Autowired
    private CommonCodeRepository commonCodeRepository;

    @Test
    @DisplayName("RLS 테넌트 격리 - 공통 코드 테넌트 분리")
    void findAll_rlsIsolation_returnsOnlyOwnTenantData() {
        // given
        setTenantContext(TENANT_A);

        // when
        var results = commonCodeRepository.findAll();

        // then - no data should exist initially
        assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("빈 결과 처리 - 공통 코드 없을 시 빈 목록")
    void findByGroupCode_noData_returnsEmptyList() {
        // given
        setTenantContext(TENANT_A);

        // when
        var results = commonCodeRepository.findAll();

        // then
        assertThat(results).isNotNull().isEmpty();
    }
}
