package com.hrsaas.auth.controller;

import com.hrsaas.auth.domain.dto.response.SessionResponse;
import com.hrsaas.auth.service.SessionService;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.security.UserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SessionController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("SessionController Tests")
class SessionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SessionService sessionService;

    @MockBean
    private com.hrsaas.common.security.SecurityFilter securityFilter;

    @MockBean
    private com.hrsaas.common.security.jwt.JwtTokenProvider jwtTokenProvider;

    private static final UUID USER_ID = UUID.fromString("10000000-0000-0000-0000-000000000001");
    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID SESSION_ID = UUID.fromString("30000000-0000-0000-0000-000000000001");

    @BeforeEach
    void setUp() {
        SecurityContextHolder.setContext(UserContext.builder()
                .userId(USER_ID)
                .tenantId(TENANT_ID)
                .roles(Set.of("SUPER_ADMIN"))
                .permissions(Set.of("*"))
                .build());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clear();
    }

    private List<SessionResponse> createMockSessions() {
        return List.of(
                SessionResponse.builder()
                        .sessionId("session-001")
                        .deviceInfo("Chrome on Windows")
                        .ipAddress("192.168.1.1")
                        .location("Seoul, South Korea")
                        .createdAt(LocalDateTime.now())
                        .lastAccessedAt(LocalDateTime.now())
                        .currentSession(true)
                        .build(),
                SessionResponse.builder()
                        .sessionId("session-002")
                        .deviceInfo("Safari on iPhone")
                        .ipAddress("192.168.1.2")
                        .location("Seoul, South Korea")
                        .createdAt(LocalDateTime.now().minusHours(1))
                        .lastAccessedAt(LocalDateTime.now().minusHours(1))
                        .currentSession(false)
                        .build()
        );
    }

    @Nested
    @DisplayName("GET /api/v1/auth/sessions (활성 세션 목록)")
    class GetActiveSessions {

        @Test
        @DisplayName("인증된 사용자 - 세션 목록 반환 (X-User-ID 헤더 없이)")
        void getActiveSessions_authenticated_returnsSessions() throws Exception {
            when(sessionService.getActiveSessions(eq(USER_ID.toString()), anyString()))
                    .thenReturn(createMockSessions());

            mockMvc.perform(get("/api/v1/auth/sessions")
                            .header("Authorization", "Bearer test-token"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data.length()").value(2))
                    .andExpect(jsonPath("$.data[0].sessionId").value("session-001"))
                    .andExpect(jsonPath("$.data[0].deviceInfo").value("Chrome on Windows"))
                    .andExpect(jsonPath("$.data[0].currentSession").value(true));

            verify(sessionService).getActiveSessions(eq(USER_ID.toString()), eq("test-token"));
        }

    }

    @Nested
    @DisplayName("DELETE /api/v1/auth/sessions/{sessionId} (특정 세션 종료)")
    class TerminateSession {

        @Test
        @DisplayName("인증된 사용자 - 세션 종료 성공 (X-User-ID 헤더 없이)")
        void terminateSession_authenticated_success() throws Exception {
            doNothing().when(sessionService).terminateSession(eq(USER_ID.toString()), eq(SESSION_ID));

            mockMvc.perform(delete("/api/v1/auth/sessions/{sessionId}", SESSION_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("세션이 종료되었습니다."));

            verify(sessionService).terminateSession(eq(USER_ID.toString()), eq(SESSION_ID));
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/auth/sessions (전체 세션 종료)")
    class TerminateAllSessions {

        @Test
        @DisplayName("인증된 사용자 - 전체 세션 종료 성공")
        void terminateAllSessions_authenticated_success() throws Exception {
            doNothing().when(sessionService).terminateAllSessions(eq(USER_ID.toString()));

            mockMvc.perform(delete("/api/v1/auth/sessions"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("모든 세션이 종료되었습니다."));

            verify(sessionService).terminateAllSessions(eq(USER_ID.toString()));
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/auth/sessions/others (다른 세션 종료)")
    class TerminateOtherSessions {

        @Test
        @DisplayName("인증된 사용자 - 다른 세션 종료 성공")
        void terminateOtherSessions_authenticated_success() throws Exception {
            doNothing().when(sessionService).terminateOtherSessions(eq(USER_ID.toString()), anyString());

            mockMvc.perform(delete("/api/v1/auth/sessions/others")
                            .header("Authorization", "Bearer current-token"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("다른 세션들이 종료되었습니다."));

            verify(sessionService).terminateOtherSessions(eq(USER_ID.toString()), eq("current-token"));
        }
    }
}
