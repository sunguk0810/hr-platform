package com.hrsaas.organization.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 공지사항 엔티티
 */
@Entity
@Table(name = "announcement", schema = "hr_core")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Announcement extends TenantAwareEntity {

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 20)
    private AnnouncementCategory category = AnnouncementCategory.NOTICE;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "author_name", length = 100)
    private String authorName;

    @Column(name = "author_department", length = 200)
    private String authorDepartment;

    @Column(name = "is_pinned", nullable = false)
    private Boolean isPinned = false;

    @Column(name = "view_count", nullable = false)
    private Long viewCount = 0L;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "is_published", nullable = false)
    private Boolean isPublished = false;

    @OneToMany(mappedBy = "announcement", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<AnnouncementAttachment> attachments = new ArrayList<>();

    @Builder
    public Announcement(String title, String content, AnnouncementCategory category,
                        UUID authorId, String authorName, String authorDepartment,
                        Boolean isPinned) {
        this.title = title;
        this.content = content;
        this.category = category != null ? category : AnnouncementCategory.NOTICE;
        this.authorId = authorId;
        this.authorName = authorName;
        this.authorDepartment = authorDepartment;
        this.isPinned = isPinned != null ? isPinned : false;
        this.viewCount = 0L;
        this.isPublished = false;
    }

    public void update(String title, String content, AnnouncementCategory category, Boolean isPinned) {
        if (title != null) {
            this.title = title;
        }
        if (content != null) {
            this.content = content;
        }
        if (category != null) {
            this.category = category;
        }
        if (isPinned != null) {
            this.isPinned = isPinned;
        }
    }

    public void publish() {
        this.isPublished = true;
        this.publishedAt = LocalDateTime.now();
    }

    public void unpublish() {
        this.isPublished = false;
        this.publishedAt = null;
    }

    public void incrementViewCount() {
        this.viewCount++;
    }

    public void addAttachment(AnnouncementAttachment attachment) {
        attachments.add(attachment);
        attachment.setAnnouncement(this);
    }

    public void removeAttachment(AnnouncementAttachment attachment) {
        attachments.remove(attachment);
        attachment.setAnnouncement(null);
    }

    public void clearAttachments() {
        attachments.clear();
    }
}
