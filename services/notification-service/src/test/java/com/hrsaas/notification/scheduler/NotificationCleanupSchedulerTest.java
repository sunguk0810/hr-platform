package com.hrsaas.notification.scheduler;

import com.hrsaas.notification.repository.NotificationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationCleanupSchedulerTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationCleanupScheduler scheduler;

    @Test
    @DisplayName("cleanupOldNotifications - deletes old notifications and logs count")
    void cleanupOldNotifications_deletesOldNotifications() {
        when(notificationRepository.deleteOlderThan(any(Instant.class))).thenReturn(42);

        scheduler.cleanupOldNotifications();

        verify(notificationRepository).deleteOlderThan(any(Instant.class));
    }

    @Test
    @DisplayName("cleanupOldNotifications - no old notifications - completes silently")
    void cleanupOldNotifications_noOldNotifications_completesQuietly() {
        when(notificationRepository.deleteOlderThan(any(Instant.class))).thenReturn(0);

        scheduler.cleanupOldNotifications();

        verify(notificationRepository).deleteOlderThan(any(Instant.class));
    }
}
