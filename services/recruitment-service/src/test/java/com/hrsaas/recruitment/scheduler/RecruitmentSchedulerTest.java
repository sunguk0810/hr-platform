package com.hrsaas.recruitment.scheduler;

import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.event.EventTopics;
import com.hrsaas.recruitment.domain.entity.Applicant;
import com.hrsaas.recruitment.domain.entity.Application;
import com.hrsaas.recruitment.domain.entity.Interview;
import com.hrsaas.recruitment.domain.entity.InterviewType;
import com.hrsaas.recruitment.domain.event.InterviewReminderEvent;
import com.hrsaas.recruitment.repository.InterviewRepository;
import com.hrsaas.recruitment.repository.JobPostingRepository;
import com.hrsaas.recruitment.service.OfferService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecruitmentSchedulerTest {

    @Mock
    private JobPostingRepository jobPostingRepository;
    @Mock
    private InterviewRepository interviewRepository;
    @Mock
    private OfferService offerService;
    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private RecruitmentScheduler scheduler;

    @Test
    @DisplayName("sendInterviewReminders - no interviews today - does nothing")
    void sendInterviewReminders_noInterviews_doesNothing() {
        when(interviewRepository.findTodayScheduledInterviews(any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        scheduler.sendInterviewReminders();

        verify(eventPublisher, never()).publish(any());
    }

    @Test
    @DisplayName("sendInterviewReminders - interviews exist - publishes events")
    void sendInterviewReminders_interviewsExist_publishesEvents() {
        // Given
        UUID tenantId = UUID.randomUUID();
        UUID interviewId = UUID.randomUUID();
        UUID applicationId = UUID.randomUUID();

        Applicant applicant = Applicant.builder()
                .name("John Doe")
                .email("john@example.com")
                .build();

        Application application = Application.builder()
                .applicant(applicant)
                .build();
        ReflectionTestUtils.setField(application, "id", applicationId);

        Interview interview = Interview.builder()
                .application(application)
                .interviewType(InterviewType.TECHNICAL)
                .round(1)
                .scheduledDate(LocalDate.now())
                .scheduledTime(LocalTime.of(10, 0))
                .build();
        ReflectionTestUtils.setField(interview, "id", interviewId);
        interview.setTenantId(tenantId);

        when(interviewRepository.findTodayScheduledInterviews(any(LocalDate.class)))
                .thenReturn(List.of(interview));

        // When
        scheduler.sendInterviewReminders();

        // Then
        ArgumentCaptor<InterviewReminderEvent> eventCaptor = ArgumentCaptor.forClass(InterviewReminderEvent.class);
        verify(eventPublisher).publish(eventCaptor.capture());

        InterviewReminderEvent event = eventCaptor.getValue();
        assertThat(event.getTopic()).isEqualTo(EventTopics.RECRUITMENT_INTERVIEW_REMINDER);
        assertThat(event.getTenantId()).isEqualTo(tenantId);
        assertThat(event.getInterviewId()).isEqualTo(interviewId);
        assertThat(event.getApplicationId()).isEqualTo(applicationId);
        assertThat(event.getApplicantName()).isEqualTo("John Doe");
        assertThat(event.getApplicantEmail()).isEqualTo("john@example.com");
        assertThat(event.getInterviewType()).isEqualTo("TECHNICAL");
        assertThat(event.getScheduledDate()).isEqualTo(LocalDate.now());
        assertThat(event.getScheduledTime()).isEqualTo(LocalTime.of(10, 0));
    }

    @Test
    @DisplayName("sendInterviewReminders - event publishing fails for one - continues others")
    void sendInterviewReminders_partialFailure_continuesProcessing() {
        // Given
        Interview interview1 = createMockInterview("User1", "user1@test.com");
        Interview interview2 = createMockInterview("User2", "user2@test.com");

        when(interviewRepository.findTodayScheduledInterviews(any(LocalDate.class)))
                .thenReturn(List.of(interview1, interview2));

        doThrow(new RuntimeException("Publish failed"))
                .when(eventPublisher).publish(argThat(event ->
                        event instanceof InterviewReminderEvent &&
                        ((InterviewReminderEvent) event).getApplicantEmail().equals("user1@test.com")));

        // When
        scheduler.sendInterviewReminders();

        // Then
        verify(eventPublisher, times(2)).publish(any(InterviewReminderEvent.class));
    }

    private Interview createMockInterview(String applicantName, String email) {
        Applicant applicant = Applicant.builder()
                .name(applicantName)
                .email(email)
                .build();

        Application application = Application.builder()
                .applicant(applicant)
                .build();
        ReflectionTestUtils.setField(application, "id", UUID.randomUUID());

        Interview interview = Interview.builder()
                .application(application)
                .interviewType(InterviewType.PERSONALITY)
                .round(1)
                .scheduledDate(LocalDate.now())
                .scheduledTime(LocalTime.of(14, 0))
                .build();
        ReflectionTestUtils.setField(interview, "id", UUID.randomUUID());
        interview.setTenantId(UUID.randomUUID());

        return interview;
    }
}
