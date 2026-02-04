package com.hrsaas.notification.repository;

import com.hrsaas.notification.domain.entity.NotificationPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, UUID> {

    @Query("SELECT p FROM NotificationPreference p WHERE p.tenantId = :tenantId AND p.userId = :userId")
    List<NotificationPreference> findByTenantIdAndUserId(@Param("tenantId") UUID tenantId, @Param("userId") UUID userId);

    @Query("SELECT p FROM NotificationPreference p WHERE p.tenantId = :tenantId AND p.userId = :userId AND p.notificationType = :type")
    Optional<NotificationPreference> findByTenantIdAndUserIdAndType(
        @Param("tenantId") UUID tenantId,
        @Param("userId") UUID userId,
        @Param("type") String type
    );
}
