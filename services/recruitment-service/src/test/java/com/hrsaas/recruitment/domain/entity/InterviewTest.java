package com.hrsaas.recruitment.domain.entity;

import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Interview Entity State Transition Tests")
class InterviewTest {

    private static final UUID TENANT_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private Interview createSchedulingInterview() {
        JobPosting jobPosting = JobPosting.builder()
                .jobCode("JOB-2026-001")
                .title("Backend Developer")
                .employmentType(EmploymentType.FULL_TIME)
                .build();

        Applicant applicant = Applicant.builder()
                .name("Hong Gildong")
                .email("hong@example.com")
                .build();

        Application application = Application.builder()
                .jobPosting(jobPosting)
                .applicant(applicant)
                .applicationNumber("APP-2026-0001")
                .build();

        return Interview.builder()
                .application(application)
                .interviewType(InterviewType.FIRST_ROUND)
                .round(1)
                .build();
    }

    @Test
    @DisplayName("schedule: SCHEDULING -> SCHEDULED 전환 성공")
    void schedule_fromScheduling_success() {
        // given
        Interview interview = createSchedulingInterview();
        assertThat(interview.getStatus()).isEqualTo(InterviewStatus.SCHEDULING);
        LocalDate date = LocalDate.now().plusDays(7);
        LocalTime time = LocalTime.of(14, 0);

        // when
        interview.schedule(date, time);

        // then
        assertThat(interview.getStatus()).isEqualTo(InterviewStatus.SCHEDULED);
        assertThat(interview.getScheduledDate()).isEqualTo(date);
        assertThat(interview.getScheduledTime()).isEqualTo(time);
    }

    @Test
    @DisplayName("schedule: COMPLETED 상태에서 schedule 호출 시 예외 발생")
    void schedule_fromCompleted_throwsException() {
        // given
        Interview interview = createSchedulingInterview();
        interview.schedule(LocalDate.now().plusDays(7), LocalTime.of(14, 0));
        interview.start();
        interview.complete("PASS", 90, "Excellent");
        assertThat(interview.getStatus()).isEqualTo(InterviewStatus.COMPLETED);

        // when & then
        assertThatThrownBy(() -> interview.schedule(LocalDate.now().plusDays(14), LocalTime.of(10, 0)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("일정 확정");
    }

    @Test
    @DisplayName("start: SCHEDULED -> IN_PROGRESS 전환 성공")
    void start_fromScheduled_success() {
        // given
        Interview interview = createSchedulingInterview();
        interview.schedule(LocalDate.now().plusDays(7), LocalTime.of(14, 0));
        assertThat(interview.getStatus()).isEqualTo(InterviewStatus.SCHEDULED);

        // when
        interview.start();

        // then
        assertThat(interview.getStatus()).isEqualTo(InterviewStatus.IN_PROGRESS);
        assertThat(interview.getStartedAt()).isNotNull();
    }

    @Test
    @DisplayName("start: SCHEDULING 상태에서 start 호출 시 예외 발생")
    void start_fromScheduling_throwsException() {
        // given
        Interview interview = createSchedulingInterview();
        assertThat(interview.getStatus()).isEqualTo(InterviewStatus.SCHEDULING);

        // when & then
        assertThatThrownBy(interview::start)
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("시작");
    }

    @Test
    @DisplayName("complete: IN_PROGRESS -> COMPLETED 전환 성공")
    void complete_fromInProgress_success() {
        // given
        Interview interview = createSchedulingInterview();
        interview.schedule(LocalDate.now().plusDays(7), LocalTime.of(14, 0));
        interview.start();
        assertThat(interview.getStatus()).isEqualTo(InterviewStatus.IN_PROGRESS);

        // when
        interview.complete("PASS", 85, "Good performance");

        // then
        assertThat(interview.getStatus()).isEqualTo(InterviewStatus.COMPLETED);
        assertThat(interview.getEndedAt()).isNotNull();
        assertThat(interview.getResult()).isEqualTo("PASS");
        assertThat(interview.getOverallScore()).isEqualTo(85);
        assertThat(interview.getResultNotes()).isEqualTo("Good performance");
    }

    @Test
    @DisplayName("complete: SCHEDULED 상태에서 complete 호출 시 예외 발생")
    void complete_fromScheduled_throwsException() {
        // given
        Interview interview = createSchedulingInterview();
        interview.schedule(LocalDate.now().plusDays(7), LocalTime.of(14, 0));
        assertThat(interview.getStatus()).isEqualTo(InterviewStatus.SCHEDULED);

        // when & then
        assertThatThrownBy(() -> interview.complete("PASS", 90, "Good"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("완료");
    }

    @Test
    @DisplayName("cancel: SCHEDULED -> CANCELLED 전환 성공")
    void cancel_fromScheduled_success() {
        // given
        Interview interview = createSchedulingInterview();
        interview.schedule(LocalDate.now().plusDays(7), LocalTime.of(14, 0));
        assertThat(interview.getStatus()).isEqualTo(InterviewStatus.SCHEDULED);

        // when
        interview.cancel();

        // then
        assertThat(interview.getStatus()).isEqualTo(InterviewStatus.CANCELLED);
    }

    @Test
    @DisplayName("cancel: COMPLETED 상태에서 cancel 호출 시 예외 발생")
    void cancel_fromCompleted_throwsException() {
        // given
        Interview interview = createSchedulingInterview();
        interview.schedule(LocalDate.now().plusDays(7), LocalTime.of(14, 0));
        interview.start();
        interview.complete("PASS", 90, "Excellent");
        assertThat(interview.getStatus()).isEqualTo(InterviewStatus.COMPLETED);

        // when & then
        assertThatThrownBy(interview::cancel)
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("취소");
    }

    @Test
    @DisplayName("postpone: SCHEDULED -> POSTPONED 전환 성공")
    void postpone_fromScheduled_success() {
        // given
        Interview interview = createSchedulingInterview();
        interview.schedule(LocalDate.now().plusDays(7), LocalTime.of(14, 0));
        assertThat(interview.getStatus()).isEqualTo(InterviewStatus.SCHEDULED);

        // when
        interview.postpone();

        // then
        assertThat(interview.getStatus()).isEqualTo(InterviewStatus.POSTPONED);
    }

    @Test
    @DisplayName("markNoShow: SCHEDULED -> NO_SHOW 전환 성공")
    void markNoShow_fromScheduled_success() {
        // given
        Interview interview = createSchedulingInterview();
        interview.schedule(LocalDate.now().plusDays(7), LocalTime.of(14, 0));
        assertThat(interview.getStatus()).isEqualTo(InterviewStatus.SCHEDULED);

        // when
        interview.markNoShow();

        // then
        assertThat(interview.getStatus()).isEqualTo(InterviewStatus.NO_SHOW);
    }
}
