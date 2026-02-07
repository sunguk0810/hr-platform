package com.hrsaas.auth.service;

import com.hrsaas.auth.domain.entity.PasswordHistory;
import com.hrsaas.auth.repository.PasswordHistoryRepository;
import com.hrsaas.auth.service.impl.PasswordHistoryServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("PasswordHistoryService Tests")
class PasswordHistoryServiceTest {

    @InjectMocks
    private PasswordHistoryServiceImpl passwordHistoryService;

    @Mock
    private PasswordHistoryRepository passwordHistoryRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private static final UUID USER_ID = UUID.fromString("10000000-0000-0000-0000-000000000001");

    @Nested
    @DisplayName("saveHistory")
    class SaveHistoryTest {

        @Test
        @DisplayName("비밀번호 이력 저장")
        void saveHistory_savesPasswordHistory() {
            passwordHistoryService.saveHistory(USER_ID, "$2a$10$oldhash");

            ArgumentCaptor<PasswordHistory> captor = ArgumentCaptor.forClass(PasswordHistory.class);
            verify(passwordHistoryRepository).save(captor.capture());

            PasswordHistory saved = captor.getValue();
            assertThat(saved.getUserId()).isEqualTo(USER_ID);
            assertThat(saved.getPasswordHash()).isEqualTo("$2a$10$oldhash");
        }
    }

    @Nested
    @DisplayName("isRecentlyUsed")
    class IsRecentlyUsedTest {

        @Test
        @DisplayName("최근 사용한 비밀번호 - true 반환")
        void isRecentlyUsed_matchFound_returnsTrue() {
            PasswordHistory history = PasswordHistory.builder()
                    .userId(USER_ID)
                    .passwordHash("$2a$10$oldhash")
                    .createdAt(OffsetDateTime.now())
                    .build();

            when(passwordHistoryRepository.findByUserIdOrderByCreatedAtDesc(eq(USER_ID), any(PageRequest.class)))
                    .thenReturn(List.of(history));
            when(passwordEncoder.matches("newPassword", "$2a$10$oldhash")).thenReturn(true);

            boolean result = passwordHistoryService.isRecentlyUsed(USER_ID, "newPassword", 5);

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("최근 사용하지 않은 비밀번호 - false 반환")
        void isRecentlyUsed_noMatch_returnsFalse() {
            PasswordHistory history = PasswordHistory.builder()
                    .userId(USER_ID)
                    .passwordHash("$2a$10$oldhash")
                    .createdAt(OffsetDateTime.now())
                    .build();

            when(passwordHistoryRepository.findByUserIdOrderByCreatedAtDesc(eq(USER_ID), any(PageRequest.class)))
                    .thenReturn(List.of(history));
            when(passwordEncoder.matches("newPassword", "$2a$10$oldhash")).thenReturn(false);

            boolean result = passwordHistoryService.isRecentlyUsed(USER_ID, "newPassword", 5);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("이력 없음 - false 반환")
        void isRecentlyUsed_noHistory_returnsFalse() {
            when(passwordHistoryRepository.findByUserIdOrderByCreatedAtDesc(eq(USER_ID), any(PageRequest.class)))
                    .thenReturn(List.of());

            boolean result = passwordHistoryService.isRecentlyUsed(USER_ID, "newPassword", 5);

            assertThat(result).isFalse();
        }
    }
}
