package com.hrsaas.organization.domain.dto.request;

import com.hrsaas.organization.domain.entity.AnnouncementCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAnnouncementRequest {

    @NotBlank(message = "제목을 입력해주세요.")
    @Size(max = 500, message = "제목은 500자 이하여야 합니다.")
    private String title;

    @NotBlank(message = "내용을 입력해주세요.")
    private String content;

    private AnnouncementCategory category;

    private Boolean isPinned;

    private Boolean isPublished;

    private String targetScope; // ALL or TARGETED

    private List<UUID> targetDepartmentIds;

    private List<UUID> targetGradeIds;

    private List<AttachmentRequest> attachments;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttachmentRequest {
        private UUID fileId;
        private String fileName;
        private String fileUrl;
        private Long fileSize;
        private String contentType;
    }
}
