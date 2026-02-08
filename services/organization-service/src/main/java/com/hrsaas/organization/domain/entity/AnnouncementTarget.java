package com.hrsaas.organization.domain.entity;

import com.hrsaas.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * 공지사항 대상 엔티티
 */
@Entity
@Table(name = "announcement_target", schema = "hr_core")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AnnouncementTarget extends BaseEntity {

    @Column(name = "announcement_id", nullable = false)
    private UUID announcementId;

    @Column(name = "target_type", nullable = false, length = 20)
    private String targetType; // DEPARTMENT, GRADE

    @Column(name = "target_id", nullable = false)
    private UUID targetId;

    @Column(name = "target_name", length = 200)
    private String targetName;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    protected void onPrePersist() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    @Builder
    public AnnouncementTarget(UUID announcementId, String targetType, UUID targetId, String targetName) {
        this.announcementId = announcementId;
        this.targetType = targetType;
        this.targetId = targetId;
        this.targetName = targetName;
    }
}
