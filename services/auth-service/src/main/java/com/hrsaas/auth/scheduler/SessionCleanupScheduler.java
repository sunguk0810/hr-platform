package com.hrsaas.auth.scheduler;

import com.hrsaas.auth.repository.UserSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class SessionCleanupScheduler {

    private final UserSessionRepository userSessionRepository;

    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void cleanupExpiredSessions() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime cleanupTime = now.minusDays(7);

        int deleted = userSessionRepository.deleteExpiredSessions(now, cleanupTime);
        if (deleted > 0) {
            log.info("Cleaned up {} expired/inactive sessions", deleted);
        }
    }
}
