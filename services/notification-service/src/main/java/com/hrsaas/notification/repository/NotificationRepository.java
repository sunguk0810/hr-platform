package com.hrsaas.notification.repository;

import com.hrsaas.notification.domain.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    @Query("SELECT n FROM Notification n WHERE n.tenantId = :tenantId AND n.recipientId = :recipientId " +
           "ORDER BY n.createdAt DESC")
    Page<Notification> findByRecipientId(@Param("tenantId") UUID tenantId, @Param("recipientId") UUID recipientId,
                                          Pageable pageable);

    @Query("SELECT n FROM Notification n WHERE n.tenantId = :tenantId AND n.recipientId = :recipientId " +
           "AND n.isRead = false ORDER BY n.createdAt DESC")
    List<Notification> findUnreadByRecipientId(@Param("tenantId") UUID tenantId, @Param("recipientId") UUID recipientId);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.tenantId = :tenantId AND n.recipientId = :recipientId " +
           "AND n.isRead = false")
    long countUnreadByRecipientId(@Param("tenantId") UUID tenantId, @Param("recipientId") UUID recipientId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP " +
           "WHERE n.tenantId = :tenantId AND n.recipientId = :recipientId AND n.isRead = false")
    int markAllAsRead(@Param("tenantId") UUID tenantId, @Param("recipientId") UUID recipientId);

    @Query("SELECT n FROM Notification n WHERE n.isSent = false ORDER BY n.createdAt ASC")
    List<Notification> findUnsentNotifications();

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoff")
    int deleteOlderThan(@Param("cutoff") Instant cutoff);
}
