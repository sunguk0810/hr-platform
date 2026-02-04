package com.hrsaas.notification.repository;

import com.hrsaas.notification.domain.entity.NotificationChannel;
import com.hrsaas.notification.domain.entity.NotificationTemplate;
import com.hrsaas.notification.domain.entity.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, UUID> {

    @Query("SELECT t FROM NotificationTemplate t WHERE t.tenantId = :tenantId AND t.isActive = true")
    Page<NotificationTemplate> findAllActiveByTenantId(@Param("tenantId") UUID tenantId, Pageable pageable);

    @Query("SELECT t FROM NotificationTemplate t WHERE t.tenantId = :tenantId AND t.code = :code AND t.channel = :channel AND t.isActive = true")
    Optional<NotificationTemplate> findByTenantIdAndCodeAndChannel(
        @Param("tenantId") UUID tenantId,
        @Param("code") String code,
        @Param("channel") NotificationChannel channel
    );

    @Query("SELECT t FROM NotificationTemplate t WHERE t.tenantId = :tenantId AND t.notificationType = :type AND t.channel = :channel AND t.isActive = true")
    Optional<NotificationTemplate> findByTenantIdAndTypeAndChannel(
        @Param("tenantId") UUID tenantId,
        @Param("type") NotificationType type,
        @Param("channel") NotificationChannel channel
    );

    boolean existsByTenantIdAndCodeAndChannel(UUID tenantId, String code, NotificationChannel channel);
}
