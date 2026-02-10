package com.hrsaas.recruitment.domain.entity;

import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Application Entity State Transition Tests")
class ApplicationTest {

    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final UUID SCREENER_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private Application createSubmittedApplication() {
        JobPosting jobPosting = JobPosting.builder()
                .jobCode("JOB-2026-001")
                .title("Backend Developer")
                .employmentType(EmploymentType.FULL_TIME)
                .build();

        Applicant applicant = Applicant.builder()
                .name("Hong Gildong")
                .email("hong@example.com")
                .build();

        return Application.builder()
                .jobPosting(jobPosting)
                .applicant(applicant)
                .applicationNumber("APP-2026-0001")
                .build();
    }

    @Test
    @DisplayName("screen: SUBMITTED -> SCREENED 전환 성공 (합격)")
    void screen_fromSubmitted_passed_success() {
        // given
        Application application = createSubmittedApplication();
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.SUBMITTED);

        // when
        application.screen(SCREENER_ID, 85, "Good candidate", true);

        // then
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.SCREENED);
        assertThat(application.getScreenedBy()).isEqualTo(SCREENER_ID);
        assertThat(application.getScreeningScore()).isEqualTo(85);
        assertThat(application.getScreeningNotes()).isEqualTo("Good candidate");
        assertThat(application.getScreenedAt()).isNotNull();
        assertThat(application.getCurrentStage()).isEqualTo("INTERVIEW");
        assertThat(application.getStageOrder()).isEqualTo(1);
    }

    @Test
    @DisplayName("screen: SCREENED 상태에서 screen 호출 시 예외 발생")
    void screen_fromScreened_throwsException() {
        // given
        Application application = createSubmittedApplication();
        application.screen(SCREENER_ID, 85, "Good", true);
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.SCREENED);

        // when & then
        assertThatThrownBy(() -> application.screen(SCREENER_ID, 90, "Again", true))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("서류심사");
    }

    @Test
    @DisplayName("startInterview: SCREENED -> INTERVIEWING 전환 성공")
    void startInterview_fromScreened_success() {
        // given
        Application application = createSubmittedApplication();
        application.screen(SCREENER_ID, 85, "Good", true);
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.SCREENED);

        // when
        application.startInterview();

        // then
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.INTERVIEWING);
    }

    @Test
    @DisplayName("startInterview: SUBMITTED 상태에서 startInterview 호출 시 예외 발생")
    void startInterview_fromSubmitted_throwsException() {
        // given
        Application application = createSubmittedApplication();
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.SUBMITTED);

        // when & then
        assertThatThrownBy(application::startInterview)
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("면접 시작");
    }

    @Test
    @DisplayName("passInterview: INTERVIEWING -> INTERVIEW_PASSED 전환 성공")
    void passInterview_fromInterviewing_success() {
        // given
        Application application = createSubmittedApplication();
        application.screen(SCREENER_ID, 85, "Good", true);
        application.startInterview();
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.INTERVIEWING);

        // when
        application.passInterview();

        // then
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.INTERVIEW_PASSED);
    }

    @Test
    @DisplayName("failInterview: INTERVIEWING -> INTERVIEW_REJECTED 전환 성공")
    void failInterview_fromInterviewing_success() {
        // given
        Application application = createSubmittedApplication();
        application.screen(SCREENER_ID, 85, "Good", true);
        application.startInterview();
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.INTERVIEWING);

        // when
        application.failInterview();

        // then
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.INTERVIEW_REJECTED);
    }

    @Test
    @DisplayName("makeOffer: INTERVIEW_PASSED -> OFFER_PENDING 전환 성공")
    void makeOffer_fromInterviewPassed_success() {
        // given
        Application application = createSubmittedApplication();
        application.screen(SCREENER_ID, 85, "Good", true);
        application.startInterview();
        application.passInterview();
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.INTERVIEW_PASSED);

        // when
        application.makeOffer();

        // then
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.OFFER_PENDING);
        assertThat(application.getCurrentStage()).isEqualTo("OFFER");
    }

    @Test
    @DisplayName("makeOffer: SUBMITTED 상태에서 makeOffer 호출 시 예외 발생")
    void makeOffer_fromSubmitted_throwsException() {
        // given
        Application application = createSubmittedApplication();
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.SUBMITTED);

        // when & then
        assertThatThrownBy(application::makeOffer)
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("제안");
    }

    @Test
    @DisplayName("hire: OFFER_PENDING -> HIRED 전환 성공")
    void hire_fromOfferPending_success() {
        // given
        Application application = createSubmittedApplication();
        application.screen(SCREENER_ID, 85, "Good", true);
        application.startInterview();
        application.passInterview();
        application.makeOffer();
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.OFFER_PENDING);

        // when
        application.hire();

        // then
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.HIRED);
        assertThat(application.getHiredAt()).isNotNull();
    }

    @Test
    @DisplayName("hire: SUBMITTED 상태에서 hire 호출 시 예외 발생")
    void hire_fromSubmitted_throwsException() {
        // given
        Application application = createSubmittedApplication();
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.SUBMITTED);

        // when & then
        assertThatThrownBy(application::hire)
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("채용 확정");
    }

    @Test
    @DisplayName("reject: SUBMITTED 상태에서 reject 성공")
    void reject_fromSubmitted_success() {
        // given
        Application application = createSubmittedApplication();
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.SUBMITTED);

        // when
        application.reject("Not qualified");

        // then
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.REJECTED);
        assertThat(application.getRejectionReason()).isEqualTo("Not qualified");
        assertThat(application.getRejectedAt()).isNotNull();
    }

    @Test
    @DisplayName("reject: HIRED 상태에서 reject 호출 시 예외 발생")
    void reject_fromHired_throwsException() {
        // given
        Application application = createSubmittedApplication();
        application.screen(SCREENER_ID, 85, "Good", true);
        application.startInterview();
        application.passInterview();
        application.makeOffer();
        application.hire();
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.HIRED);

        // when & then
        assertThatThrownBy(() -> application.reject("Too late"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("불합격");
    }

    @Test
    @DisplayName("withdraw: SUBMITTED 상태에서 withdraw 성공")
    void withdraw_fromSubmitted_success() {
        // given
        Application application = createSubmittedApplication();
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.SUBMITTED);

        // when
        application.withdraw();

        // then
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.WITHDRAWN);
        assertThat(application.getWithdrawnAt()).isNotNull();
    }

    @Test
    @DisplayName("withdraw: HIRED 상태에서 withdraw 호출 시 예외 발생")
    void withdraw_fromHired_throwsException() {
        // given
        Application application = createSubmittedApplication();
        application.screen(SCREENER_ID, 85, "Good", true);
        application.startInterview();
        application.passInterview();
        application.makeOffer();
        application.hire();
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.HIRED);

        // when & then
        assertThatThrownBy(application::withdraw)
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("채용 확정");
    }
}
