package com.hrsaas.organization.repository;

import com.hrsaas.organization.domain.entity.AnnouncementAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnnouncementAttachmentRepository extends JpaRepository<AnnouncementAttachment, UUID> {

    List<AnnouncementAttachment> findByAnnouncementId(UUID announcementId);

    void deleteByAnnouncementId(UUID announcementId);
}
