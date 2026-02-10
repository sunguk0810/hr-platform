package com.hrsaas.recruitment.scheduler;

import com.hrsaas.recruitment.domain.entity.Applicant;
import com.hrsaas.recruitment.repository.ApplicantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * 개인정보 자동 파기 스케줄러 — 1년 경과 후 불합격/취소 지원자의 PII 삭제
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PrivacyPurgeScheduler {

    private final ApplicantRepository applicantRepository;

    @Scheduled(cron = "0 0 2 * * ?") // Daily 02:00
    @Transactional
    public void purgeExpiredPersonalData() {
        log.info("Starting personal data purge for expired applicants");

        Instant cutoff = Instant.now().minus(365, ChronoUnit.DAYS);
        List<Applicant> expiredApplicants = applicantRepository.findExpiredForPurge(cutoff);

        int purgedCount = 0;
        for (Applicant applicant : expiredApplicants) {
            try {
                purgePersonalData(applicant);
                applicantRepository.save(applicant);
                purgedCount++;
            } catch (Exception e) {
                log.error("Failed to purge personal data for applicant: id={}", applicant.getId(), e);
            }
        }

        log.info("Personal data purge completed: purged={}/{}", purgedCount, expiredApplicants.size());
    }

    private void purgePersonalData(Applicant applicant) {
        applicant.setName("삭제된 지원자");
        applicant.setEmail("purged@deleted.local");
        applicant.setPhone(null);
        applicant.setBirthDate(null);
        applicant.setGender(null);
        applicant.setAddress(null);
        applicant.setResumeFileId(null);
        applicant.setPortfolioUrl(null);
        applicant.setLinkedinUrl(null);
        applicant.setGithubUrl(null);
        applicant.setEducation(null);
        applicant.setExperience(null);
        applicant.setCertificates(null);
        applicant.setLanguages(null);
        applicant.setNotes("개인정보 보호법에 따라 자동 파기됨");
    }
}
