package com.hrsaas.recruitment.domain.event;

import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Event published to send interview reminders.
 */
@Getter
@SuperBuilder
public class InterviewReminderEvent extends DomainEvent {

    private final UUID interviewId;
    private final UUID applicationId;
    private final String applicantName;
    private final String applicantEmail;
    private final String interviewType;
    private final Integer round;
    private final LocalDate scheduledDate;
    private final LocalTime scheduledTime;
    private final Integer durationMinutes;
    private final String location;
    private final String meetingUrl;
    private final List<Map<String, Object>> interviewers;

    @Override
    public String getTopic() {
        return EventTopics.RECRUITMENT_INTERVIEW_REMINDER;
    }
}
