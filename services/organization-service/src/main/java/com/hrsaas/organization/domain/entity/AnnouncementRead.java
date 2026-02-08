package com.hrsaas.organization.domain.entity;

import com.hrsaas.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * 공지사항 읽음 확인 엔티티
 */
@Entity
@Table(name = "announcement_read", schema = "hr_core",
    uniqueConstraints = @UniqueConstraint(columnNames = {"announcement_id", "employee_id"}))
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AnnouncementRead extends BaseEntity {

    @Column(name = "announcement_id", nullable = false)
    private UUID announcementId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "read_at", nullable = false)
    private Instant readAt;

    @Builder
    public AnnouncementRead(UUID announcementId, UUID employeeId) {
        this.announcementId = announcementId;
        this.employeeId = employeeId;
        this.readAt = Instant.now();
    }
}
