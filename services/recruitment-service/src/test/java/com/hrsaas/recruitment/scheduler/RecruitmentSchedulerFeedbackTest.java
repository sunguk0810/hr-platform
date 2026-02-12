package com.hrsaas.recruitment.scheduler;

import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.recruitment.domain.entity.Applicant;
import com.hrsaas.recruitment.domain.entity.Application;
import com.hrsaas.recruitment.domain.entity.Interview;
import com.hrsaas.recruitment.domain.entity.InterviewType;
import com.hrsaas.recruitment.domain.event.InterviewFeedbackReminderEvent;
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
class RecruitmentSchedulerFeedbackTest {

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
    @DisplayName("sendFeedbackReminders - no interviews deadline today - does nothing")
    void sendFeedbackReminders_noInterviews_doesNothing() {
        when(interviewRepository.findFeedbackDeadlineToday(any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        scheduler.sendFeedbackReminders();

        verify(eventPublisher, never()).publish(any());
    }

    @Test
    @DisplayName("sendFeedbackReminders - interviews exist - publishes events")
    void sendFeedbackReminders_interviewsExist_publishesEvents() {
        // Given
        UUID tenantId = UUID.randomUUID();
        UUID interviewId = UUID.randomUUID();
        UUID applicationId = UUID.randomUUID();
        LocalDate deadline = LocalDate.now();

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
                .scheduledDate(LocalDate.now().minusDays(1))
                .scheduledTime(LocalTime.of(10, 0))
                .feedbackDeadline(deadline)
                .build();
        ReflectionTestUtils.setField(interview, "id", interviewId);
        ReflectionTestUtils.setField(interview, "tenantId", tenantId);

        when(interviewRepository.findFeedbackDeadlineToday(any(LocalDate.class)))
                .thenReturn(List.of(interview));

        // When
        scheduler.sendFeedbackReminders();

        // Then
        ArgumentCaptor<InterviewFeedbackReminderEvent> eventCaptor = ArgumentCaptor.forClass(InterviewFeedbackReminderEvent.class);
        verify(eventPublisher).publish(eventCaptor.capture());

        InterviewFeedbackReminderEvent event = eventCaptor.getValue();
        assertThat(event.getInterviewId()).isEqualTo(interviewId);
        assertThat(event.getFeedbackDeadline()).isEqualTo(deadline);
    }
}
