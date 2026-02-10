package com.hrsaas.recruitment.domain.entity;

import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("JobPosting Entity State Transition Tests")
class JobPostingTest {

    private static final UUID TENANT_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private JobPosting createDraftJobPosting() {
        return JobPosting.builder()
                .jobCode("JOB-2026-001")
                .title("Backend Developer")
                .employmentType(EmploymentType.FULL_TIME)
                .build();
    }

    @Test
    @DisplayName("publish: DRAFT -> PUBLISHED 전환 성공")
    void publish_fromDraft_success() {
        // given
        JobPosting jobPosting = createDraftJobPosting();
        assertThat(jobPosting.getStatus()).isEqualTo(JobStatus.DRAFT);

        // when
        jobPosting.publish();

        // then
        assertThat(jobPosting.getStatus()).isEqualTo(JobStatus.PUBLISHED);
        assertThat(jobPosting.getOpenDate()).isEqualTo(LocalDate.now());
    }

    @Test
    @DisplayName("publish: PUBLISHED 상태에서 publish 호출 시 예외 발생")
    void publish_fromPublished_throwsException() {
        // given
        JobPosting jobPosting = createDraftJobPosting();
        jobPosting.publish();
        assertThat(jobPosting.getStatus()).isEqualTo(JobStatus.PUBLISHED);

        // when & then
        assertThatThrownBy(jobPosting::publish)
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("공고");
    }

    @Test
    @DisplayName("close: PUBLISHED -> CLOSED 전환 성공")
    void close_fromPublished_success() {
        // given
        JobPosting jobPosting = createDraftJobPosting();
        jobPosting.publish();
        assertThat(jobPosting.getStatus()).isEqualTo(JobStatus.PUBLISHED);

        // when
        jobPosting.close();

        // then
        assertThat(jobPosting.getStatus()).isEqualTo(JobStatus.CLOSED);
    }

    @Test
    @DisplayName("close: DRAFT 상태에서 close 호출 시 예외 발생")
    void close_fromDraft_throwsException() {
        // given
        JobPosting jobPosting = createDraftJobPosting();
        assertThat(jobPosting.getStatus()).isEqualTo(JobStatus.DRAFT);

        // when & then
        assertThatThrownBy(jobPosting::close)
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("마감");
    }

    @Test
    @DisplayName("complete: CLOSED -> COMPLETED 전환 성공")
    void complete_fromClosed_success() {
        // given
        JobPosting jobPosting = createDraftJobPosting();
        jobPosting.publish();
        jobPosting.close();
        assertThat(jobPosting.getStatus()).isEqualTo(JobStatus.CLOSED);

        // when
        jobPosting.complete();

        // then
        assertThat(jobPosting.getStatus()).isEqualTo(JobStatus.COMPLETED);
    }

    @Test
    @DisplayName("complete: PUBLISHED 상태에서 complete 호출 시 예외 발생")
    void complete_fromPublished_throwsException() {
        // given
        JobPosting jobPosting = createDraftJobPosting();
        jobPosting.publish();
        assertThat(jobPosting.getStatus()).isEqualTo(JobStatus.PUBLISHED);

        // when & then
        assertThatThrownBy(jobPosting::complete)
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("완료");
    }

    @Test
    @DisplayName("cancel: DRAFT -> CANCELLED 전환 성공")
    void cancel_fromDraft_success() {
        // given
        JobPosting jobPosting = createDraftJobPosting();
        assertThat(jobPosting.getStatus()).isEqualTo(JobStatus.DRAFT);

        // when
        jobPosting.cancel();

        // then
        assertThat(jobPosting.getStatus()).isEqualTo(JobStatus.CANCELLED);
    }

    @Test
    @DisplayName("cancel: COMPLETED 상태에서 cancel 호출 시 예외 발생")
    void cancel_fromCompleted_throwsException() {
        // given
        JobPosting jobPosting = createDraftJobPosting();
        jobPosting.publish();
        jobPosting.close();
        jobPosting.complete();
        assertThat(jobPosting.getStatus()).isEqualTo(JobStatus.COMPLETED);

        // when & then
        assertThatThrownBy(jobPosting::cancel)
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("취소");
    }

    @Test
    @DisplayName("isOpen: PUBLISHED 상태이고 마감일 미경과 시 true 반환")
    void isOpen_published_notPastCloseDate_returnsTrue() {
        // given
        JobPosting jobPosting = createDraftJobPosting();
        jobPosting.setCloseDate(LocalDate.now().plusDays(7));
        jobPosting.publish();

        // when
        boolean result = jobPosting.isOpen();

        // then
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("isOpen: CLOSED 상태이면 false 반환")
    void isOpen_closed_returnsFalse() {
        // given
        JobPosting jobPosting = createDraftJobPosting();
        jobPosting.publish();
        jobPosting.close();

        // when
        boolean result = jobPosting.isOpen();

        // then
        assertThat(result).isFalse();
    }
}
