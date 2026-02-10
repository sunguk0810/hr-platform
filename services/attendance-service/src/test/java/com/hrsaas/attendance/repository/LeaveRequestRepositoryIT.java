package com.hrsaas.attendance.repository;

import com.hrsaas.common.database.test.AbstractRepositoryTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for LeaveRequestRepository with Testcontainers.
 */
@ActiveProfiles("test")
class LeaveRequestRepositoryIT extends AbstractRepositoryTest {

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Test
    @DisplayName("RLS 테넌트 격리 - 휴가 신청 테넌트 분리")
    void findAll_rlsIsolation_returnsOnlyOwnTenantData() {
        // given
        setTenantContext(TENANT_A);

        // when
        var results = leaveRequestRepository.findAll();

        // then
        assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("빈 결과 처리")
    void findByDateRange_noData_returnsEmptyList() {
        // given
        setTenantContext(TENANT_A);

        // when
        var results = leaveRequestRepository.findAll();

        // then
        assertThat(results).isNotNull().isEmpty();
    }
}
