package com.hrsaas.recruitment.scheduler;

import com.hrsaas.recruitment.domain.entity.JobPosting;
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
    private final OfferService offerService;
    private final InterviewService interviewService;

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
     * TODO: 실제 알림 발송 구현
     */
    @Scheduled(cron = "0 0 9 * * ?")
    public void sendFeedbackReminders() {
        log.info("Starting feedback reminder check");
        interviewService.sendFeedbackReminders();
        log.info("Completed feedback reminder check");
    }

    /**
     * 면접 당일 알림 (매일 08:00)
     * TODO: 실제 알림 발송 구현
     */
    @Scheduled(cron = "0 0 8 * * ?")
    public void sendInterviewReminders() {
        log.info("Starting interview reminder check");
        // TODO: 오늘 예정된 면접에 대해 알림 발송
        log.info("Completed interview reminder check");
    }
}
