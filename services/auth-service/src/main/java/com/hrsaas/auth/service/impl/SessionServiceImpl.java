package com.hrsaas.auth.service.impl;

import com.hrsaas.auth.domain.dto.response.SessionResponse;
import com.hrsaas.auth.domain.entity.UserSession;
import com.hrsaas.auth.repository.UserSessionRepository;
import com.hrsaas.auth.service.SessionService;
import com.hrsaas.common.core.exception.BusinessException;
import com.maxmind.geoip2.DatabaseReader;
import com.maxmind.geoip2.model.CityResponse;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.net.InetAddress;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionServiceImpl implements SessionService {

    private final UserSessionRepository sessionRepository;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String SESSION_PREFIX = "session:";
    private static final String BLACKLIST_PREFIX = "token:blacklist:";

    @Value("${auth.session.max-sessions:5}")
    private int maxSessions;

    @Value("${auth.session.timeout-hours:24}")
    private int sessionTimeoutHours;

    @Value("${auth.geoip.database-path:}")
    private String geoipDatabasePath;

    private DatabaseReader geoipReader;

    @PostConstruct
    public void initGeoip() {
        if (geoipDatabasePath != null && !geoipDatabasePath.isBlank()) {
            try {
                File database = new File(geoipDatabasePath);
                if (database.exists()) {
                    geoipReader = new DatabaseReader.Builder(database).build();
                    log.info("GeoIP database loaded from: {}", geoipDatabasePath);
                } else {
                    log.warn("GeoIP database not found at: {}", geoipDatabasePath);
                }
            } catch (Exception e) {
                log.warn("Failed to load GeoIP database: {}", e.getMessage());
            }
        }
    }

    @Override
    @Transactional
    public UserSession createSession(String userId, UUID tenantId, String accessToken,
                                     String refreshToken, String deviceInfo, String ipAddress, String userAgent) {
        log.debug("Creating session for user: {}", userId);

        // Check max sessions limit
        long activeSessionCount = sessionRepository.countByUserIdAndActiveTrue(userId);
        if (activeSessionCount >= maxSessions) {
            log.warn("Max sessions reached for user: {}. Removing oldest session.", userId);
            // Remove oldest session
            List<UserSession> activeSessions = sessionRepository.findByUserIdAndActiveTrue(userId);
            if (!activeSessions.isEmpty()) {
                UserSession oldest = activeSessions.stream()
                    .min((s1, s2) -> s1.getCreatedAt().compareTo(s2.getCreatedAt()))
                    .orElse(activeSessions.get(0));
                oldest.setActive(false);
                sessionRepository.save(oldest);
            }
        }

        // Create new session
        UserSession session = UserSession.builder()
            .userId(userId)
            .tenantId(tenantId)
            .sessionToken(accessToken)
            .refreshToken(refreshToken)
            .deviceInfo(deviceInfo)
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .location(resolveLocation(ipAddress))
            .expiresAt(LocalDateTime.now().plusHours(sessionTimeoutHours))
            .active(true)
            .build();

        session = sessionRepository.save(session);

        // Cache session in Redis
        String sessionKey = SESSION_PREFIX + accessToken;
        redisTemplate.opsForValue().set(sessionKey, session.getId().toString(), sessionTimeoutHours, TimeUnit.HOURS);

        log.info("Session created for user: {}, sessionId: {}", userId, session.getId());
        return session;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SessionResponse> getActiveSessions(String userId, String currentSessionToken) {
        log.debug("Getting active sessions for user: {}", userId);

        List<UserSession> sessions = sessionRepository.findByUserIdAndActiveTrue(userId);

        return sessions.stream()
            .map(session -> mapToResponse(session, currentSessionToken))
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void terminateSession(String userId, UUID sessionId) {
        log.info("Terminating session: {} for user: {}", sessionId, userId);

        int updated = sessionRepository.deactivateByIdAndUserId(sessionId, userId);
        if (updated == 0) {
            throw new BusinessException("AUTH_013", "세션을 찾을 수 없습니다.", HttpStatus.NOT_FOUND);
        }

        // Add session token to blacklist
        sessionRepository.findById(sessionId).ifPresent(session -> {
            blacklistToken(session.getSessionToken());
            if (session.getRefreshToken() != null) {
                blacklistToken(session.getRefreshToken());
            }
        });

        log.info("Session terminated: {}", sessionId);
    }

    @Override
    @Transactional
    public void terminateAllSessions(String userId) {
        log.info("Terminating all sessions for user: {}", userId);

        List<UserSession> sessions = sessionRepository.findByUserIdAndActiveTrue(userId);
        sessions.forEach(session -> {
            blacklistToken(session.getSessionToken());
            if (session.getRefreshToken() != null) {
                blacklistToken(session.getRefreshToken());
            }
        });

        sessionRepository.deactivateAllByUserId(userId);
        log.info("All sessions terminated for user: {}", userId);
    }

    @Override
    @Transactional
    public void terminateOtherSessions(String userId, String currentSessionToken) {
        log.info("Terminating other sessions for user: {}", userId);

        List<UserSession> sessions = sessionRepository.findByUserIdAndActiveTrue(userId);
        sessions.stream()
            .filter(session -> !session.getSessionToken().equals(currentSessionToken))
            .forEach(session -> {
                session.setActive(false);
                blacklistToken(session.getSessionToken());
                if (session.getRefreshToken() != null) {
                    blacklistToken(session.getRefreshToken());
                }
                sessionRepository.save(session);
            });

        log.info("Other sessions terminated for user: {}", userId);
    }

    @Override
    @Transactional
    public void updateLastAccessed(String sessionToken) {
        sessionRepository.updateLastAccessedAt(sessionToken, LocalDateTime.now());
    }

    @Override
    public boolean validateSession(String sessionToken) {
        // Check blacklist first
        if (Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + sessionToken))) {
            return false;
        }

        // Check Redis cache
        String sessionKey = SESSION_PREFIX + sessionToken;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(sessionKey))) {
            return true;
        }

        // Check database
        return sessionRepository.findBySessionTokenAndActiveTrue(sessionToken).isPresent();
    }

    @Override
    @Transactional
    public void terminateByAccessToken(String accessToken) {
        log.info("Terminating session by access token");

        sessionRepository.findBySessionTokenAndActiveTrue(accessToken).ifPresent(session -> {
            session.setActive(false);
            sessionRepository.save(session);

            blacklistToken(session.getSessionToken());
            if (session.getRefreshToken() != null) {
                blacklistToken(session.getRefreshToken());
            }

            // Remove Redis cache
            String sessionKey = SESSION_PREFIX + accessToken;
            redisTemplate.delete(sessionKey);

            log.info("Session terminated by access token, sessionId: {}", session.getId());
        });
    }

    private void blacklistToken(String token) {
        String blacklistKey = BLACKLIST_PREFIX + token;
        redisTemplate.opsForValue().set(blacklistKey, "1", 24, TimeUnit.HOURS);
    }

    private String resolveLocation(String ipAddress) {
        if (geoipReader == null || ipAddress == null || ipAddress.isBlank()) {
            return "Unknown";
        }

        try {
            InetAddress inetAddress = InetAddress.getByName(ipAddress);
            if (inetAddress.isSiteLocalAddress() || inetAddress.isLoopbackAddress()) {
                return "Local Network";
            }
            CityResponse response = geoipReader.city(inetAddress);
            String country = response.getCountry() != null ? response.getCountry().getName() : null;
            String city = response.getCity() != null ? response.getCity().getName() : null;

            if (country != null && city != null) {
                return country + ", " + city;
            } else if (country != null) {
                return country;
            }
            return "Unknown";
        } catch (Exception e) {
            log.debug("GeoIP lookup failed for IP: {}", ipAddress);
            return "Unknown";
        }
    }

    private SessionResponse mapToResponse(UserSession session, String currentSessionToken) {
        return SessionResponse.builder()
            .sessionId(session.getId().toString())
            .deviceInfo(session.getDeviceInfo())
            .ipAddress(maskIpAddress(session.getIpAddress()))
            .location(session.getLocation())
            .createdAt(session.getCreatedAt())
            .lastAccessedAt(session.getLastAccessedAt())
            .currentSession(session.getSessionToken().equals(currentSessionToken))
            .build();
    }

    private String maskIpAddress(String ipAddress) {
        if (ipAddress == null) {
            return null;
        }
        String[] parts = ipAddress.split("\\.");
        if (parts.length == 4) {
            return parts[0] + "." + parts[1] + ".*.*";
        }
        return ipAddress;
    }
}
