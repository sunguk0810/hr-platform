package com.hrsaas.auth.repository;

import com.hrsaas.auth.domain.entity.UserMfa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserMfaRepository extends JpaRepository<UserMfa, UUID> {

    Optional<UserMfa> findByUserIdAndMfaType(UUID userId, String mfaType);

    Optional<UserMfa> findByUserIdAndMfaTypeAndEnabledTrue(UUID userId, String mfaType);

    boolean existsByUserIdAndEnabledTrue(UUID userId);
}
