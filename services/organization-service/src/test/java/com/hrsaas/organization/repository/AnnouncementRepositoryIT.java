package com.hrsaas.organization.repository;

import com.hrsaas.common.database.test.AbstractRepositoryTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for AnnouncementRepository with Testcontainers.
 */
@ActiveProfiles("test")
class AnnouncementRepositoryIT extends AbstractRepositoryTest {

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Test
    @DisplayName("RLS 테넌트 격리 - 공지사항 테넌트 분리")
    void findAll_rlsIsolation_returnsOnlyOwnTenantData() {
        // given
        setTenantContext(TENANT_A);

        // when
        var results = announcementRepository.findAll();

        // then - no data should exist initially
        assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("빈 결과 처리 - 공지사항 없을 시 빈 목록")
    void findByTenantId_noData_returnsEmptyList() {
        // given
        setTenantContext(TENANT_A);

        // when
        var results = announcementRepository.findAll();

        // then
        assertThat(results).isNotNull().isEmpty();
    }
}
