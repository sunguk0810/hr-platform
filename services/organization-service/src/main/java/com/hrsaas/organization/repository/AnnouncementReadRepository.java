package com.hrsaas.organization.repository;

import com.hrsaas.organization.domain.entity.AnnouncementRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnnouncementReadRepository extends JpaRepository<AnnouncementRead, UUID> {

    boolean existsByAnnouncementIdAndEmployeeId(UUID announcementId, UUID employeeId);

    @Query("SELECT COUNT(r) FROM AnnouncementRead r WHERE r.announcementId = :announcementId")
    long countByAnnouncementId(@Param("announcementId") UUID announcementId);

    @Query("SELECT r FROM AnnouncementRead r WHERE r.announcementId = :announcementId ORDER BY r.readAt DESC")
    List<AnnouncementRead> findByAnnouncementId(@Param("announcementId") UUID announcementId);
}
