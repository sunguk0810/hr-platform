package com.hrsaas.auth.repository;

import com.hrsaas.auth.domain.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {

    List<UserSession> findByUserIdAndActiveTrue(String userId);

    Optional<UserSession> findBySessionTokenAndActiveTrue(String sessionToken);

    Optional<UserSession> findByRefreshTokenAndActiveTrue(String refreshToken);

    @Modifying
    @Query("UPDATE UserSession s SET s.active = false WHERE s.userId = :userId")
    void deactivateAllByUserId(@Param("userId") String userId);

    @Modifying
    @Query("UPDATE UserSession s SET s.active = false WHERE s.id = :sessionId AND s.userId = :userId")
    int deactivateByIdAndUserId(@Param("sessionId") UUID sessionId, @Param("userId") String userId);

    @Modifying
    @Query("UPDATE UserSession s SET s.lastAccessedAt = :lastAccessedAt WHERE s.sessionToken = :sessionToken")
    void updateLastAccessedAt(@Param("sessionToken") String sessionToken, @Param("lastAccessedAt") LocalDateTime lastAccessedAt);

    @Modifying
    @Query("DELETE FROM UserSession s WHERE s.expiresAt < :now OR (s.active = false AND s.lastAccessedAt < :cleanupTime)")
    int deleteExpiredSessions(@Param("now") LocalDateTime now, @Param("cleanupTime") LocalDateTime cleanupTime);

    long countByUserIdAndActiveTrue(String userId);
}
