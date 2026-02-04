package com.hrsaas.auth.service;

import com.hrsaas.auth.domain.dto.response.SessionResponse;
import com.hrsaas.auth.domain.entity.UserSession;

import java.util.List;
import java.util.UUID;

public interface SessionService {

    /**
     * Creates a new session for the user.
     *
     * @param userId      The user ID
     * @param tenantId    The tenant ID
     * @param accessToken The access token
     * @param refreshToken The refresh token
     * @param deviceInfo  The device information
     * @param ipAddress   The client IP address
     * @param userAgent   The user agent string
     * @return The created session
     */
    UserSession createSession(String userId, UUID tenantId, String accessToken,
                              String refreshToken, String deviceInfo, String ipAddress, String userAgent);

    /**
     * Gets all active sessions for a user.
     *
     * @param userId The user ID
     * @param currentSessionToken The current session token to mark as current
     * @return List of session responses
     */
    List<SessionResponse> getActiveSessions(String userId, String currentSessionToken);

    /**
     * Terminates a specific session.
     *
     * @param userId    The user ID
     * @param sessionId The session ID to terminate
     */
    void terminateSession(String userId, UUID sessionId);

    /**
     * Terminates all sessions for a user.
     *
     * @param userId The user ID
     */
    void terminateAllSessions(String userId);

    /**
     * Terminates all sessions except the current one.
     *
     * @param userId              The user ID
     * @param currentSessionToken The current session token to keep
     */
    void terminateOtherSessions(String userId, String currentSessionToken);

    /**
     * Updates the last accessed time for a session.
     *
     * @param sessionToken The session token
     */
    void updateLastAccessed(String sessionToken);

    /**
     * Validates a session token.
     *
     * @param sessionToken The session token
     * @return true if valid, false otherwise
     */
    boolean validateSession(String sessionToken);
}
