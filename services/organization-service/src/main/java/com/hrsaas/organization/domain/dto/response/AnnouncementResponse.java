package com.hrsaas.organization.domain.dto.response;

import com.hrsaas.organization.domain.entity.Announcement;
import com.hrsaas.organization.domain.entity.AnnouncementAttachment;
import com.hrsaas.organization.domain.entity.AnnouncementCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementResponse {

    private UUID id;
    private String title;
    private String content;
    private AnnouncementCategory category;
    private UUID authorId;
    private String authorName;
    private String authorDepartment;
    private Boolean isPinned;
    private Long viewCount;
    private Boolean isPublished;
    private LocalDateTime publishedAt;
    private List<AttachmentResponse> attachments;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttachmentResponse {
        private UUID id;
        private UUID fileId;
        private String fileName;
        private String fileUrl;
        private Long fileSize;
        private String contentType;

        public static AttachmentResponse from(AnnouncementAttachment attachment) {
            return AttachmentResponse.builder()
                .id(attachment.getId())
                .fileId(attachment.getFileId())
                .fileName(attachment.getFileName())
                .fileUrl(attachment.getFileUrl())
                .fileSize(attachment.getFileSize())
                .contentType(attachment.getContentType())
                .build();
        }
    }

    public static AnnouncementResponse from(Announcement announcement) {
        return AnnouncementResponse.builder()
            .id(announcement.getId())
            .title(announcement.getTitle())
            .content(announcement.getContent())
            .category(announcement.getCategory())
            .authorId(announcement.getAuthorId())
            .authorName(announcement.getAuthorName())
            .authorDepartment(announcement.getAuthorDepartment())
            .isPinned(announcement.getIsPinned())
            .viewCount(announcement.getViewCount())
            .isPublished(announcement.getIsPublished())
            .publishedAt(announcement.getPublishedAt())
            .attachments(announcement.getAttachments() != null
                ? announcement.getAttachments().stream()
                    .map(AttachmentResponse::from)
                    .toList()
                : List.of())
            .createdAt(announcement.getCreatedAt())
            .updatedAt(announcement.getUpdatedAt())
            .build();
    }

    public static AnnouncementResponse fromWithoutContent(Announcement announcement) {
        return AnnouncementResponse.builder()
            .id(announcement.getId())
            .title(announcement.getTitle())
            .category(announcement.getCategory())
            .authorId(announcement.getAuthorId())
            .authorName(announcement.getAuthorName())
            .authorDepartment(announcement.getAuthorDepartment())
            .isPinned(announcement.getIsPinned())
            .viewCount(announcement.getViewCount())
            .isPublished(announcement.getIsPublished())
            .publishedAt(announcement.getPublishedAt())
            .createdAt(announcement.getCreatedAt())
            .updatedAt(announcement.getUpdatedAt())
            .build();
    }
}
