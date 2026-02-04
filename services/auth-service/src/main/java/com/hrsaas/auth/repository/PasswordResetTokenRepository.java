package com.hrsaas.auth.repository;

import com.hrsaas.auth.domain.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findByTokenAndUsedFalse(String token);

    @Query("SELECT p FROM PasswordResetToken p WHERE p.userId = :userId AND p.used = false AND p.expiresAt > :now ORDER BY p.createdAt DESC")
    Optional<PasswordResetToken> findLatestValidTokenByUserId(@Param("userId") String userId, @Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE PasswordResetToken p SET p.used = true, p.usedAt = :now WHERE p.userId = :userId AND p.used = false")
    void invalidateAllTokensByUserId(@Param("userId") String userId, @Param("now") LocalDateTime now);

    @Modifying
    @Query("DELETE FROM PasswordResetToken p WHERE p.expiresAt < :now OR p.used = true")
    int deleteExpiredOrUsedTokens(@Param("now") LocalDateTime now);
}
