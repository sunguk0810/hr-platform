package com.hrsaas.auth.scheduler;

import com.hrsaas.auth.repository.UserSessionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("SessionCleanupScheduler Tests")
class SessionCleanupSchedulerTest {

    @InjectMocks
    private SessionCleanupScheduler scheduler;

    @Mock
    private UserSessionRepository userSessionRepository;

    @Test
    @DisplayName("만료된 세션 정리")
    void cleanupExpiredSessions_deletesExpiredSessions() {
        when(userSessionRepository.deleteExpiredSessions(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(5);

        scheduler.cleanupExpiredSessions();

        verify(userSessionRepository).deleteExpiredSessions(any(LocalDateTime.class), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("만료된 세션 없음 - 정상 종료")
    void cleanupExpiredSessions_noExpired_completesNormally() {
        when(userSessionRepository.deleteExpiredSessions(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(0);

        scheduler.cleanupExpiredSessions();

        verify(userSessionRepository).deleteExpiredSessions(any(LocalDateTime.class), any(LocalDateTime.class));
    }
}
