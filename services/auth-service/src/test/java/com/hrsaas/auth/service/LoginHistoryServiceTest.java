package com.hrsaas.auth.service;

import com.hrsaas.auth.domain.entity.LoginHistory;
import com.hrsaas.auth.repository.LoginHistoryRepository;
import com.hrsaas.auth.service.impl.LoginHistoryServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LoginHistoryService Tests")
class LoginHistoryServiceTest {

    @InjectMocks
    private LoginHistoryServiceImpl loginHistoryService;

    @Mock
    private LoginHistoryRepository loginHistoryRepository;

    private static final String USER_ID = "admin";
    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Nested
    @DisplayName("recordSuccess")
    class RecordSuccessTest {

        @Test
        @DisplayName("로그인 성공 이력 기록")
        void recordSuccess_savesLoginHistory() {
            loginHistoryService.recordSuccess(USER_ID, TENANT_ID, "192.168.1.1", "Chrome");

            ArgumentCaptor<LoginHistory> captor = ArgumentCaptor.forClass(LoginHistory.class);
            verify(loginHistoryRepository).save(captor.capture());

            LoginHistory saved = captor.getValue();
            assertThat(saved.getUserId()).isEqualTo(USER_ID);
            assertThat(saved.getTenantId()).isEqualTo(TENANT_ID);
            assertThat(saved.getStatus()).isEqualTo("SUCCESS");
            assertThat(saved.getIpAddress()).isEqualTo("192.168.1.1");
            assertThat(saved.getUserAgent()).isEqualTo("Chrome");
        }

        @Test
        @DisplayName("저장 실패해도 예외 전파 안 함")
        void recordSuccess_saveFailure_doesNotThrow() {
            when(loginHistoryRepository.save(any())).thenThrow(new RuntimeException("DB error"));

            loginHistoryService.recordSuccess(USER_ID, TENANT_ID, "192.168.1.1", "Chrome");

            verify(loginHistoryRepository).save(any());
        }
    }

    @Nested
    @DisplayName("recordFailure")
    class RecordFailureTest {

        @Test
        @DisplayName("로그인 실패 이력 기록")
        void recordFailure_savesLoginHistory() {
            loginHistoryService.recordFailure(USER_ID, TENANT_ID, "192.168.1.1", "Chrome", "INVALID_PASSWORD");

            ArgumentCaptor<LoginHistory> captor = ArgumentCaptor.forClass(LoginHistory.class);
            verify(loginHistoryRepository).save(captor.capture());

            LoginHistory saved = captor.getValue();
            assertThat(saved.getUserId()).isEqualTo(USER_ID);
            assertThat(saved.getStatus()).isEqualTo("FAILURE");
            assertThat(saved.getFailureReason()).isEqualTo("INVALID_PASSWORD");
        }

        @Test
        @DisplayName("저장 실패해도 예외 전파 안 함")
        void recordFailure_saveFailure_doesNotThrow() {
            when(loginHistoryRepository.save(any())).thenThrow(new RuntimeException("DB error"));

            loginHistoryService.recordFailure(USER_ID, TENANT_ID, "192.168.1.1", "Chrome", "INVALID_PASSWORD");

            verify(loginHistoryRepository).save(any());
        }
    }
}
