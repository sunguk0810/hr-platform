package com.hrsaas.organization.service.impl;

import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.organization.domain.dto.request.CreateAnnouncementRequest;
import com.hrsaas.organization.domain.dto.request.UpdateAnnouncementRequest;
import com.hrsaas.organization.domain.dto.response.AnnouncementResponse;
import com.hrsaas.organization.domain.entity.*;
import com.hrsaas.organization.repository.AnnouncementReadRepository;
import com.hrsaas.organization.repository.AnnouncementRepository;
import com.hrsaas.organization.repository.AnnouncementTargetRepository;
import com.hrsaas.organization.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnnouncementServiceImpl implements AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final AnnouncementTargetRepository announcementTargetRepository;
    private final AnnouncementReadRepository announcementReadRepository;

    @Override
    @Transactional
    public AnnouncementResponse create(CreateAnnouncementRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        var currentUser = SecurityContextHolder.getCurrentUser();

        Announcement announcement = Announcement.builder()
            .title(request.getTitle())
            .content(request.getContent())
            .category(request.getCategory() != null ? request.getCategory() : AnnouncementCategory.NOTICE)
            .authorId(currentUser != null ? currentUser.getUserId() : null)
            .authorName(currentUser != null ? currentUser.getUsername() : null)
            .authorDepartment(currentUser != null ? currentUser.getDepartmentName() : null)
            .isPinned(request.getIsPinned())
            .build();

        // G05: Set target scope
        if ("TARGETED".equalsIgnoreCase(request.getTargetScope())) {
            announcement.setTargetScope(TargetScope.TARGETED);
        }

        // Handle attachments
        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            for (CreateAnnouncementRequest.AttachmentRequest attachmentReq : request.getAttachments()) {
                AnnouncementAttachment attachment = AnnouncementAttachment.builder()
                    .fileId(attachmentReq.getFileId())
                    .fileName(attachmentReq.getFileName())
                    .fileUrl(attachmentReq.getFileUrl())
                    .fileSize(attachmentReq.getFileSize())
                    .contentType(attachmentReq.getContentType())
                    .build();
                announcement.addAttachment(attachment);
            }
        }

        // Auto-publish if requested
        if (Boolean.TRUE.equals(request.getIsPublished())) {
            announcement.publish();
        }

        Announcement saved = announcementRepository.save(announcement);

        // G05: Save targets
        saveTargets(saved.getId(), request.getTargetDepartmentIds(), "DEPARTMENT");
        saveTargets(saved.getId(), request.getTargetGradeIds(), "GRADE");

        log.info("Announcement created: id={}, title={}", saved.getId(), saved.getTitle());

        return AnnouncementResponse.from(saved);
    }

    @Override
    @Transactional
    public AnnouncementResponse getById(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Announcement announcement = findByIdAndTenantId(id, tenantId);

        // Increment view count
        announcementRepository.incrementViewCount(id);
        announcement.incrementViewCount();

        // G12: Record read
        var currentUser = SecurityContextHolder.getCurrentUser();
        UUID employeeId = currentUser != null ? currentUser.getUserId() : null;
        if (employeeId != null && !announcementReadRepository.existsByAnnouncementIdAndEmployeeId(id, employeeId)) {
            announcementReadRepository.save(AnnouncementRead.builder()
                .announcementId(id)
                .employeeId(employeeId)
                .build());
        }

        AnnouncementResponse response = AnnouncementResponse.from(announcement);
        // G12: Enrich with read info
        response.setReadCount(announcementReadRepository.countByAnnouncementId(id));
        response.setIsRead(employeeId != null &&
            announcementReadRepository.existsByAnnouncementIdAndEmployeeId(id, employeeId));
        response.setTargetScope(announcement.getTargetScope() != null
            ? announcement.getTargetScope().name() : "ALL");

        return response;
    }

    @Override
    public Page<AnnouncementResponse> getAll(Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<Announcement> announcements = announcementRepository.findAllByTenantId(tenantId, pageable);
        return announcements.map(AnnouncementResponse::fromWithoutContent);
    }

    @Override
    public Page<AnnouncementResponse> getPublished(Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<Announcement> announcements = announcementRepository.findPublishedByTenantId(tenantId, pageable);
        return announcements.map(AnnouncementResponse::fromWithoutContent);
    }

    @Override
    public Page<AnnouncementResponse> search(AnnouncementCategory category, String keyword, Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<Announcement> announcements;

        if (category != null && keyword != null && !keyword.isBlank()) {
            announcements = announcementRepository.findByTenantIdAndCategoryAndKeyword(
                tenantId, category, keyword, pageable);
        } else if (category != null) {
            announcements = announcementRepository.findByTenantIdAndCategory(
                tenantId, category, pageable);
        } else if (keyword != null && !keyword.isBlank()) {
            announcements = announcementRepository.findByTenantIdAndKeyword(
                tenantId, keyword, pageable);
        } else {
            announcements = announcementRepository.findAllByTenantId(tenantId, pageable);
        }

        return announcements.map(AnnouncementResponse::fromWithoutContent);
    }

    @Override
    public List<AnnouncementResponse> getPinned() {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<Announcement> announcements = announcementRepository.findPinnedByTenantId(tenantId);
        return announcements.stream()
            .map(AnnouncementResponse::fromWithoutContent)
            .toList();
    }

    @Override
    @Transactional
    public AnnouncementResponse update(UUID id, UpdateAnnouncementRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Announcement announcement = findByIdAndTenantId(id, tenantId);

        announcement.update(
            request.getTitle(),
            request.getContent(),
            request.getCategory(),
            request.getIsPinned()
        );

        // Handle attachments update
        if (request.getAttachments() != null) {
            announcement.clearAttachments();
            for (UpdateAnnouncementRequest.AttachmentRequest attachmentReq : request.getAttachments()) {
                AnnouncementAttachment attachment = AnnouncementAttachment.builder()
                    .fileId(attachmentReq.getFileId())
                    .fileName(attachmentReq.getFileName())
                    .fileUrl(attachmentReq.getFileUrl())
                    .fileSize(attachmentReq.getFileSize())
                    .contentType(attachmentReq.getContentType())
                    .build();
                announcement.addAttachment(attachment);
            }
        }

        // Handle publish status
        if (request.getIsPublished() != null) {
            if (request.getIsPublished()) {
                announcement.publish();
            } else {
                announcement.unpublish();
            }
        }

        Announcement saved = announcementRepository.save(announcement);

        log.info("Announcement updated: id={}", id);

        return AnnouncementResponse.from(saved);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Announcement announcement = findByIdAndTenantId(id, tenantId);
        announcementRepository.delete(announcement);
        log.info("Announcement deleted: id={}", id);
    }

    @Override
    @Transactional
    public void publish(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Announcement announcement = findByIdAndTenantId(id, tenantId);
        announcement.publish();
        announcementRepository.save(announcement);
        log.info("Announcement published: id={}", id);
    }

    @Override
    @Transactional
    public void unpublish(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Announcement announcement = findByIdAndTenantId(id, tenantId);
        announcement.unpublish();
        announcementRepository.save(announcement);
        log.info("Announcement unpublished: id={}", id);
    }

    @Override
    public List<AnnouncementRead> getReads(UUID announcementId) {
        return announcementReadRepository.findByAnnouncementId(announcementId);
    }

    private Announcement findByIdAndTenantId(UUID id, UUID tenantId) {
        return announcementRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new NotFoundException("ORG_004", "공지사항을 찾을 수 없습니다: " + id));
    }

    private void saveTargets(UUID announcementId, List<UUID> targetIds, String targetType) {
        if (targetIds == null || targetIds.isEmpty()) return;
        for (UUID targetId : targetIds) {
            AnnouncementTarget target = AnnouncementTarget.builder()
                .announcementId(announcementId)
                .targetType(targetType)
                .targetId(targetId)
                .build();
            announcementTargetRepository.save(target);
        }
    }
}
