package com.hrsaas.auth.service;

import com.hrsaas.auth.domain.dto.response.SessionResponse;
import com.hrsaas.auth.domain.entity.UserSession;
import com.hrsaas.auth.repository.UserSessionRepository;
import com.hrsaas.auth.service.impl.SessionServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("SessionService Tests")
class SessionServiceTest {

    @InjectMocks
    private SessionServiceImpl sessionService;

    @Mock
    private UserSessionRepository userSessionRepository;

    @Mock
    private RedisTemplate<String, String> redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private static final String USER_ID = "10000000-0000-0000-0000-000000000001";
    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private List<UserSession> createMockSessions() {
        UserSession session1 = new UserSession();
        session1.setId(UUID.fromString("30000000-0000-0000-0000-000000000001"));
        session1.setUserId(USER_ID);
        session1.setTenantId(TENANT_ID);
        session1.setSessionToken("current-token");
        session1.setRefreshToken("refresh-token-1");
        session1.setDeviceInfo("Chrome on Windows");
        session1.setIpAddress("192.168.1.1");
        session1.setLocation("Seoul, South Korea");
        session1.setCreatedAt(LocalDateTime.now());
        session1.setLastAccessedAt(LocalDateTime.now());
        session1.setExpiresAt(LocalDateTime.now().plusHours(24));
        session1.setActive(true);

        UserSession session2 = new UserSession();
        session2.setId(UUID.fromString("30000000-0000-0000-0000-000000000002"));
        session2.setUserId(USER_ID);
        session2.setTenantId(TENANT_ID);
        session2.setSessionToken("other-token");
        session2.setRefreshToken("refresh-token-2");
        session2.setDeviceInfo("Safari on iPhone");
        session2.setIpAddress("192.168.1.2");
        session2.setLocation("Seoul, South Korea");
        session2.setCreatedAt(LocalDateTime.now().minusHours(1));
        session2.setLastAccessedAt(LocalDateTime.now().minusHours(1));
        session2.setExpiresAt(LocalDateTime.now().plusHours(23));
        session2.setActive(true);

        return List.of(session1, session2);
    }

    @Nested
    @DisplayName("getActiveSessions")
    class GetActiveSessionsTest {

        @Test
        @DisplayName("활성 세션 목록 반환 - 현재 세션 표시")
        void getActiveSessions_returnsSessionsWithCurrentMarked() {
            when(userSessionRepository.findByUserIdAndActiveTrue(USER_ID))
                    .thenReturn(createMockSessions());

            List<SessionResponse> sessions = sessionService.getActiveSessions(USER_ID, "current-token");

            assertThat(sessions).hasSize(2);
            assertThat(sessions.get(0).isCurrentSession()).isTrue();
            assertThat(sessions.get(0).getDeviceInfo()).isEqualTo("Chrome on Windows");
            assertThat(sessions.get(1).isCurrentSession()).isFalse();
            assertThat(sessions.get(1).getDeviceInfo()).isEqualTo("Safari on iPhone");
        }

        @Test
        @DisplayName("세션 없음 - 빈 목록 반환")
        void getActiveSessions_noSessions_returnsEmptyList() {
            when(userSessionRepository.findByUserIdAndActiveTrue(USER_ID))
                    .thenReturn(List.of());

            List<SessionResponse> sessions = sessionService.getActiveSessions(USER_ID, "any-token");

            assertThat(sessions).isEmpty();
        }
    }

    @Nested
    @DisplayName("terminateSession")
    class TerminateSessionTest {

        @Test
        @DisplayName("특정 세션 종료")
        void terminateSession_validSessionId_deactivates() {
            UUID sessionId = UUID.fromString("30000000-0000-0000-0000-000000000001");
            when(userSessionRepository.deactivateByIdAndUserId(sessionId, USER_ID)).thenReturn(1);

            sessionService.terminateSession(USER_ID, sessionId);

            verify(userSessionRepository).deactivateByIdAndUserId(sessionId, USER_ID);
        }
    }

    @Nested
    @DisplayName("terminateAllSessions")
    class TerminateAllSessionsTest {

        @Test
        @DisplayName("전체 세션 종료")
        void terminateAllSessions_deactivatesAll() {
            sessionService.terminateAllSessions(USER_ID);

            verify(userSessionRepository).deactivateAllByUserId(USER_ID);
        }
    }

    @Nested
    @DisplayName("validateSession")
    class ValidateSessionTest {

        @Test
        @DisplayName("유효한 세션 토큰 - true 반환")
        void validateSession_validToken_returnsTrue() {
            UserSession session = createMockSessions().get(0);
            lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
            when(redisTemplate.hasKey(anyString())).thenReturn(false);
            when(userSessionRepository.findBySessionTokenAndActiveTrue("current-token"))
                    .thenReturn(java.util.Optional.of(session));

            boolean result = sessionService.validateSession("current-token");

            assertThat(result).isTrue();
        }
    }
}
