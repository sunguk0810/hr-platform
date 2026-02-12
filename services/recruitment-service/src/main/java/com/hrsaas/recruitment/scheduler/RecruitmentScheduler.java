package com.hrsaas.recruitment.scheduler;

import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.recruitment.domain.entity.Applicant;
import com.hrsaas.recruitment.domain.entity.Application;
import com.hrsaas.recruitment.domain.entity.Interview;
import com.hrsaas.recruitment.domain.entity.JobPosting;
import com.hrsaas.recruitment.domain.event.InterviewFeedbackReminderEvent;
import com.hrsaas.recruitment.domain.event.InterviewReminderEvent;
import com.hrsaas.recruitment.repository.InterviewRepository;
import com.hrsaas.recruitment.repository.JobPostingRepository;
import com.hrsaas.recruitment.service.InterviewService;
import com.hrsaas.recruitment.service.OfferService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * 채용 스케줄러
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RecruitmentScheduler {

    private final JobPostingRepository jobPostingRepository;
    private final InterviewRepository interviewRepository;
    private final OfferService offerService;
    private final InterviewService interviewService;
    private final EventPublisher eventPublisher;

    /**
     * 마감된 채용공고 자동 처리 (매일 00:05)
     */
    @Scheduled(cron = "0 5 0 * * ?")
    @Transactional
    public void closeExpiredJobPostings() {
        log.info("Starting expired job postings check");

        List<JobPosting> expiredPostings = jobPostingRepository.findExpired(LocalDate.now());

        for (JobPosting posting : expiredPostings) {
            posting.close();
            jobPostingRepository.save(posting);
            log.info("Job posting closed: {}", posting.getJobCode());
        }

        log.info("Closed {} expired job postings", expiredPostings.size());
    }

    /**
     * 만료된 제안 처리 (매일 01:00)
     */
    @Scheduled(cron = "0 0 1 * * ?")
    public void checkExpiredOffers() {
        log.info("Starting expired offers check");
        offerService.checkExpiredOffers();
        log.info("Completed expired offers check");
    }

    /**
     * 피드백 기한 알림 (매일 09:00)
     */
    @Scheduled(cron = "0 0 9 * * ?")
    @Transactional(readOnly = true)
    public void sendFeedbackReminders() {
        log.info("Starting feedback reminder check");

        List<Interview> deadlineInterviews = interviewRepository.findFeedbackDeadlineToday(LocalDate.now());

        for (Interview interview : deadlineInterviews) {
            try {
                Application application = interview.getApplication();
                Applicant applicant = application.getApplicant();

                InterviewFeedbackReminderEvent event = InterviewFeedbackReminderEvent.builder()
                        .tenantId(interview.getTenantId())
                        .interviewId(interview.getId())
                        .applicationId(application.getId())
                        .applicantName(applicant.getName())
                        .applicantEmail(applicant.getEmail())
                        .interviewType(interview.getInterviewType().name())
                        .round(interview.getRound())
                        .scheduledDate(interview.getScheduledDate())
                        .scheduledTime(interview.getScheduledTime())
                        .interviewers(interview.getInterviewers())
                        .feedbackDeadline(interview.getFeedbackDeadline())
                        .build();

                eventPublisher.publish(event);
            } catch (Exception e) {
                log.error("Failed to send feedback reminder for interview: {}", interview.getId(), e);
            }
        }

        log.info("Completed feedback reminder check. Sent {} reminders.", deadlineInterviews.size());
    }

    /**
     * 면접 당일 알림 (매일 08:00)
     */
    @Scheduled(cron = "0 0 8 * * ?")
    @Transactional(readOnly = true)
    public void sendInterviewReminders() {
        log.info("Starting interview reminder check");

        List<Interview> todayInterviews = interviewRepository.findTodayScheduledInterviews(LocalDate.now());

        for (Interview interview : todayInterviews) {
            try {
                Application application = interview.getApplication();
                Applicant applicant = application.getApplicant();

                InterviewReminderEvent event = InterviewReminderEvent.builder()
                        .tenantId(interview.getTenantId()) // TenantAwareEntity
                        .interviewId(interview.getId())
                        .applicationId(application.getId())
                        .applicantName(applicant.getName())
                        .applicantEmail(applicant.getEmail())
                        .interviewType(interview.getInterviewType().name())
                        .round(interview.getRound())
                        .scheduledDate(interview.getScheduledDate())
                        .scheduledTime(interview.getScheduledTime())
                        .durationMinutes(interview.getDurationMinutes())
                        .location(interview.getLocation())
                        .meetingUrl(interview.getMeetingUrl())
                        .interviewers(interview.getInterviewers())
                        .build();

                eventPublisher.publish(event);
            } catch (Exception e) {
                log.error("Failed to send reminder for interview: {}", interview.getId(), e);
            }
        }

        log.info("Completed interview reminder check. Sent {} reminders.", todayInterviews.size());
    }
}
