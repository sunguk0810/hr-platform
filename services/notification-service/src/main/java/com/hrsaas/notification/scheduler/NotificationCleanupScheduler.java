package com.hrsaas.notification.scheduler;

import com.hrsaas.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * NTF-G04: 90일 경과 알림 자동 삭제 스케줄러
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationCleanupScheduler {

    private final NotificationRepository notificationRepository;

    /**
     * 매일 새벽 3시에 90일 이상 된 알림 삭제
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupOldNotifications() {
        Instant cutoff = Instant.now().minus(90, ChronoUnit.DAYS);
        int deleted = notificationRepository.deleteOlderThan(cutoff);
        if (deleted > 0) {
            log.info("Cleaned up {} notifications older than 90 days", deleted);
        }
    }
}
