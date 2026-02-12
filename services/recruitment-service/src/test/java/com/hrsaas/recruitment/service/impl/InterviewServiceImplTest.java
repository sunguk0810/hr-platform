package com.hrsaas.recruitment.service.impl;

import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.recruitment.client.NotificationServiceClient;
import com.hrsaas.recruitment.client.dto.SendNotificationRequest;
import com.hrsaas.recruitment.domain.dto.request.CompleteInterviewRequest;
import com.hrsaas.recruitment.domain.dto.request.CreateInterviewRequest;
import com.hrsaas.recruitment.domain.dto.request.ScheduleInterviewRequest;
import com.hrsaas.recruitment.domain.dto.response.InterviewResponse;
import com.hrsaas.recruitment.domain.entity.*;
import com.hrsaas.recruitment.domain.event.InterviewScheduledEvent;
import com.hrsaas.recruitment.repository.ApplicationRepository;
import com.hrsaas.recruitment.repository.InterviewRepository;
import com.hrsaas.recruitment.repository.InterviewScoreRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InterviewServiceImplTest {

    @Mock
    private InterviewRepository interviewRepository;

    @Mock
    private InterviewScoreRepository interviewScoreRepository;

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private EventPublisher eventPublisher;

    @Mock
    private NotificationServiceClient notificationServiceClient;

    @InjectMocks
    private InterviewServiceImpl interviewService;

    private UUID tenantId;
    private UUID applicationId;
    private Application application;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        TenantContext.setCurrentTenant(tenantId);

        applicationId = UUID.randomUUID();
        application = createScreenedApplication();
        setEntityId(application, applicationId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // ===== create =====

    @Test
    @DisplayName("create: validRequest - success")
    void create_validRequest_success() {
        // given
        List<Map<String, Object>> interviewers = List.of(
                Map.of("id", UUID.randomUUID().toString(), "name", "Interviewer Kim"),
                Map.of("id", UUID.randomUUID().toString(), "name", "Interviewer Park")
        );

        CreateInterviewRequest request = CreateInterviewRequest.builder()
                .applicationId(applicationId)
                .interviewType(InterviewType.FIRST_ROUND)
                .round(1)
                .scheduledDate(LocalDate.of(2026, 3, 15))
                .scheduledTime(LocalTime.of(10, 0))
                .durationMinutes(60)
                .location("Conference Room A")
                .interviewers(interviewers)
                .notes("Technical interview for backend position")
                .feedbackDeadline(LocalDate.of(2026, 3, 20))
                .build();

        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(application));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> {
            Interview interview = invocation.getArgument(0);
            setEntityId(interview, UUID.randomUUID());
            return interview;
        });
        when(applicationRepository.save(any(Application.class))).thenReturn(application);

        // when
        InterviewResponse response = interviewService.create(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getInterviewType()).isEqualTo(InterviewType.FIRST_ROUND);
        assertThat(response.getRound()).isEqualTo(1);
        assertThat(response.getStatus()).isEqualTo(InterviewStatus.SCHEDULING);
        assertThat(response.getScheduledDate()).isEqualTo(LocalDate.of(2026, 3, 15));
        assertThat(response.getDurationMinutes()).isEqualTo(60);
        assertThat(response.getLocation()).isEqualTo("Conference Room A");

        verify(applicationRepository).findById(applicationId);
        verify(interviewRepository).save(any(Interview.class));
        verify(applicationRepository).save(any(Application.class));
    }

    // ===== schedule =====

    @Test
    @DisplayName("schedule: validInterview - publishesEvent")
    void schedule_validInterview_publishesEvent() {
        // given
        UUID interviewId = UUID.randomUUID();
        Interview interview = createSchedulingInterview(application);
        setEntityId(interview, interviewId);

        ScheduleInterviewRequest request = ScheduleInterviewRequest.builder()
                .scheduledDate(LocalDate.of(2026, 3, 20))
                .scheduledTime(LocalTime.of(14, 0))
                .location("Meeting Room B")
                .meetingUrl("https://meet.example.com/interview-123")
                .build();

        when(interviewRepository.findById(interviewId)).thenReturn(Optional.of(interview));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(eventPublisher).publish(any(InterviewScheduledEvent.class));

        // when
        InterviewResponse response = interviewService.schedule(interviewId, request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(InterviewStatus.SCHEDULED);
        assertThat(response.getScheduledDate()).isEqualTo(LocalDate.of(2026, 3, 20));
        assertThat(response.getScheduledTime()).isEqualTo(LocalTime.of(14, 0));
        assertThat(response.getLocation()).isEqualTo("Meeting Room B");
        assertThat(response.getMeetingUrl()).isEqualTo("https://meet.example.com/interview-123");

        verify(interviewRepository).findById(interviewId);
        verify(interviewRepository).save(any(Interview.class));
        verify(eventPublisher).publish(any(InterviewScheduledEvent.class));
    }

    // ===== complete =====

    @Test
    @DisplayName("complete: passResult - updatesApplicationStatus")
    void complete_passResult_updatesApplicationStatus() {
        // given
        UUID interviewId = UUID.randomUUID();
        Application interviewingApp = createInterviewingApplication();
        setEntityId(interviewingApp, UUID.randomUUID());
        Interview interview = createInProgressInterview(interviewingApp);
        setEntityId(interview, interviewId);

        CompleteInterviewRequest request = CompleteInterviewRequest.builder()
                .result("PASS")
                .overallScore(85)
                .resultNotes("Excellent technical skills and communication")
                .build();

        when(interviewRepository.findById(interviewId)).thenReturn(Optional.of(interview));
        when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        InterviewResponse response = interviewService.complete(interviewId, request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(InterviewStatus.COMPLETED);
        assertThat(response.getResult()).isEqualTo("PASS");
        assertThat(response.getOverallScore()).isEqualTo(85);
        assertThat(response.getResultNotes()).isEqualTo("Excellent technical skills and communication");
        assertThat(response.isPassed()).isTrue();

        // Verify application status was updated to INTERVIEW_PASSED
        assertThat(interviewingApp.getStatus()).isEqualTo(ApplicationStatus.INTERVIEW_PASSED);

        verify(interviewRepository).findById(interviewId);
        verify(applicationRepository).save(any(Application.class));
        verify(interviewRepository).save(any(Interview.class));
    }

    @Test
    @DisplayName("complete: failResult - updatesApplicationStatus")
    void complete_failResult_updatesApplicationStatus() {
        // given
        UUID interviewId = UUID.randomUUID();
        Application interviewingApp = createInterviewingApplication();
        setEntityId(interviewingApp, UUID.randomUUID());
        Interview interview = createInProgressInterview(interviewingApp);
        setEntityId(interview, interviewId);

        CompleteInterviewRequest request = CompleteInterviewRequest.builder()
                .result("FAIL")
                .overallScore(40)
                .resultNotes("Did not meet technical requirements")
                .build();

        when(interviewRepository.findById(interviewId)).thenReturn(Optional.of(interview));
        when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        InterviewResponse response = interviewService.complete(interviewId, request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(InterviewStatus.COMPLETED);
        assertThat(response.getResult()).isEqualTo("FAIL");
        assertThat(response.getOverallScore()).isEqualTo(40);
        assertThat(response.isPassed()).isFalse();

        // Verify application status was updated to INTERVIEW_REJECTED
        assertThat(interviewingApp.getStatus()).isEqualTo(ApplicationStatus.INTERVIEW_REJECTED);

        verify(interviewRepository).findById(interviewId);
        verify(applicationRepository).save(any(Application.class));
        verify(interviewRepository).save(any(Interview.class));
    }

    // ===== cancel =====

    @Test
    @DisplayName("cancel: validInterview - success")
    void cancel_validInterview_success() {
        // given
        UUID interviewId = UUID.randomUUID();
        Interview interview = createScheduledInterview(application);
        setEntityId(interview, interviewId);

        when(interviewRepository.findById(interviewId)).thenReturn(Optional.of(interview));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        InterviewResponse response = interviewService.cancel(interviewId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(InterviewStatus.CANCELLED);

        verify(interviewRepository).findById(interviewId);
        verify(interviewRepository).save(any(Interview.class));
    }

    // ===== sendFeedbackReminders =====

    @Test
    @DisplayName("sendFeedbackReminders: sendsNotificationsToPendingInterviewers")
    void sendFeedbackReminders_sendsNotificationsToPendingInterviewers() {
        // given
        UUID interviewId = UUID.randomUUID();
        UUID interviewer1Id = UUID.randomUUID();
        UUID interviewer2Id = UUID.randomUUID();

        // Application & Interview Setup
        Application app = createScreenedApplication();
        setEntityId(app, UUID.randomUUID());

        Interview interview = Interview.builder()
                .application(app)
                .interviewType(InterviewType.FIRST_ROUND)
                .scheduledDate(LocalDate.now().minusDays(1))
                .scheduledTime(LocalTime.of(10, 0))
                .interviewers(List.of(
                        Map.of("id", interviewer1Id.toString(), "name", "Interviewer 1", "email", "int1@test.com"),
                        Map.of("id", interviewer2Id.toString(), "name", "Interviewer 2", "email", "int2@test.com")
                ))
                .feedbackDeadline(LocalDate.now())
                .build();
        // Manually set status to IN_PROGRESS via reflection or helper if needed,
        // but builder sets SCHEDULING. Let's assume we update it.
        try {
            var statusField = Interview.class.getDeclaredField("status");
            statusField.setAccessible(true);
            statusField.set(interview, InterviewStatus.IN_PROGRESS);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        setEntityId(interview, interviewId);

        // Interviewer 1 submitted a score
        InterviewScore score1 = InterviewScore.builder()
                .interview(interview)
                .interviewerId(interviewer1Id)
                .interviewerName("Interviewer 1")
                .criterion("Technical")
                .score(4)
                .build();
        // Add score to interview's list (since OneToMany is mappedBy, we need to ensure getter returns it if we rely on getter)
        // However, Interview.scores is initialized to new ArrayList<>().
        // We can add it directly via reflection or if there is a method.
        // Interview has 'scores' field.
        try {
            var scoresField = Interview.class.getDeclaredField("scores");
            scoresField.setAccessible(true);
            ((List<InterviewScore>) scoresField.get(interview)).add(score1);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        when(interviewRepository.findByFeedbackDeadlineAndStatusIn(any(LocalDate.class), anyList()))
                .thenReturn(List.of(interview));

        // when
        interviewService.sendFeedbackReminders();

        // then
        // Expect notification ONLY for Interviewer 2
        verify(notificationServiceClient, times(1)).send(argThat(request ->
                request.getRecipientId().equals(interviewer2Id) &&
                request.getRecipientEmail().equals("int2@test.com") &&
                request.getTitle().contains("면접 결과 피드백 요청")
        ));

        // Verify Interviewer 1 did NOT receive notification
        verify(notificationServiceClient, never()).send(argThat(request ->
                request.getRecipientId().equals(interviewer1Id)
        ));
    }

    // ===== Helper methods =====

    private Application createScreenedApplication() {
        JobPosting posting = JobPosting.builder()
                .jobCode("JOB-2026-001")
                .title("Backend Developer")
                .departmentId(UUID.randomUUID())
                .departmentName("Engineering")
                .employmentType(EmploymentType.FULL_TIME)
                .workLocation("Seoul")
                .build();
        posting.publish();
        setEntityId(posting, UUID.randomUUID());

        Applicant applicant = Applicant.builder()
                .name("John Doe")
                .email("john.doe@example.com")
                .phone("010-1234-5678")
                .birthDate(LocalDate.of(1990, 1, 15))
                .gender("MALE")
                .address("Seoul, Korea")
                .build();
        setEntityId(applicant, UUID.randomUUID());

        Application app = Application.builder()
                .jobPosting(posting)
                .applicant(applicant)
                .applicationNumber("APP-20260210-000001")
                .coverLetter("Cover letter")
                .expectedSalary(60000000L)
                .build();
        setEntityId(app, UUID.randomUUID());

        // Transition: SUBMITTED -> SCREENED
        app.screen(UUID.randomUUID(), 90, "Strong candidate", true);
        return app;
    }

    private Application createInterviewingApplication() {
        Application app = createScreenedApplication();
        app.startInterview();
        return app;
    }

    private Interview createSchedulingInterview(Application application) {
        List<Map<String, Object>> interviewers = List.of(
                Map.of("id", UUID.randomUUID().toString(), "name", "Interviewer Kim")
        );

        return Interview.builder()
                .application(application)
                .interviewType(InterviewType.FIRST_ROUND)
                .round(1)
                .scheduledDate(LocalDate.of(2026, 3, 15))
                .scheduledTime(LocalTime.of(10, 0))
                .durationMinutes(60)
                .location("Conference Room A")
                .interviewers(interviewers)
                .notes("Technical interview")
                .feedbackDeadline(LocalDate.of(2026, 3, 20))
                .build();
    }

    private Interview createScheduledInterview(Application application) {
        Interview interview = createSchedulingInterview(application);
        interview.schedule(LocalDate.of(2026, 3, 15), LocalTime.of(10, 0));
        return interview;
    }

    private Interview createInProgressInterview(Application application) {
        Interview interview = createScheduledInterview(application);
        interview.start();
        return interview;
    }

    private void setEntityId(Object entity, UUID id) {
        try {
            var field = findField(entity.getClass(), "id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set entity ID", e);
        }
    }

    private java.lang.reflect.Field findField(Class<?> clazz, String name) {
        while (clazz != null) {
            try {
                return clazz.getDeclaredField(name);
            } catch (NoSuchFieldException e) {
                clazz = clazz.getSuperclass();
            }
        }
        throw new RuntimeException("Field not found: " + name);
    }
}
