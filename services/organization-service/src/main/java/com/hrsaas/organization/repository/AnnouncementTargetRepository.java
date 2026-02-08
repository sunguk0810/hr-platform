package com.hrsaas.organization.repository;

import com.hrsaas.organization.domain.entity.AnnouncementTarget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnnouncementTargetRepository extends JpaRepository<AnnouncementTarget, UUID> {

    List<AnnouncementTarget> findByAnnouncementId(UUID announcementId);

    void deleteByAnnouncementId(UUID announcementId);
}
