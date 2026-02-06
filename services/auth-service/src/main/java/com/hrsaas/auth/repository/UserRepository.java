package com.hrsaas.auth.repository;

import com.hrsaas.auth.domain.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, UUID> {

    Optional<UserEntity> findByUsername(String username);

    Optional<UserEntity> findByEmail(String email);

    Optional<UserEntity> findByUsernameAndTenantId(String username, UUID tenantId);

    boolean existsByUsername(String username);

    boolean existsByEmailAndTenantId(String email, UUID tenantId);
}
