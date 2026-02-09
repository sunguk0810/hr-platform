package com.hrsaas.organization.repository;

import com.hrsaas.organization.domain.entity.Announcement;
import com.hrsaas.organization.domain.entity.AnnouncementCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, UUID> {

    @Query("SELECT a FROM Announcement a WHERE a.tenantId = :tenantId " +
           "ORDER BY a.isPinned DESC, a.publishedAt DESC NULLS LAST, a.createdAt DESC")
    Page<Announcement> findAllByTenantId(
        @Param("tenantId") UUID tenantId,
        Pageable pageable);

    @Query("SELECT a FROM Announcement a WHERE a.tenantId = :tenantId AND a.isPublished = true " +
           "ORDER BY a.isPinned DESC, a.publishedAt DESC")
    Page<Announcement> findPublishedByTenantId(
        @Param("tenantId") UUID tenantId,
        Pageable pageable);

    @Query("SELECT a FROM Announcement a WHERE a.tenantId = :tenantId " +
           "AND a.category = :category " +
           "ORDER BY a.isPinned DESC, a.publishedAt DESC NULLS LAST, a.createdAt DESC")
    Page<Announcement> findByTenantIdAndCategory(
        @Param("tenantId") UUID tenantId,
        @Param("category") AnnouncementCategory category,
        Pageable pageable);

    /**
     * 키워드 검색 — PostgreSQL FTS (tsvector + GIN) 사용.
     * LOWER LIKE 대비 인덱스 활용으로 대폭 성능 개선.
     */
    @Query(value = "SELECT * FROM hr_core.announcement a WHERE a.tenant_id = :tenantId " +
           "AND a.search_vector @@ plainto_tsquery('simple', :keyword) " +
           "ORDER BY a.is_pinned DESC, a.published_at DESC NULLS LAST, a.created_at DESC",
           countQuery = "SELECT COUNT(*) FROM hr_core.announcement a WHERE a.tenant_id = :tenantId " +
           "AND a.search_vector @@ plainto_tsquery('simple', :keyword)",
           nativeQuery = true)
    Page<Announcement> findByTenantIdAndKeyword(
        @Param("tenantId") UUID tenantId,
        @Param("keyword") String keyword,
        Pageable pageable);

    /**
     * 카테고리 + 키워드 검색 — PostgreSQL FTS (tsvector + GIN) 사용.
     */
    @Query(value = "SELECT * FROM hr_core.announcement a WHERE a.tenant_id = :tenantId " +
           "AND a.category = :#{#category.name()} " +
           "AND a.search_vector @@ plainto_tsquery('simple', :keyword) " +
           "ORDER BY a.is_pinned DESC, a.published_at DESC NULLS LAST, a.created_at DESC",
           countQuery = "SELECT COUNT(*) FROM hr_core.announcement a WHERE a.tenant_id = :tenantId " +
           "AND a.category = :#{#category.name()} " +
           "AND a.search_vector @@ plainto_tsquery('simple', :keyword)",
           nativeQuery = true)
    Page<Announcement> findByTenantIdAndCategoryAndKeyword(
        @Param("tenantId") UUID tenantId,
        @Param("category") AnnouncementCategory category,
        @Param("keyword") String keyword,
        Pageable pageable);

    @Query("SELECT a FROM Announcement a WHERE a.tenantId = :tenantId AND a.isPinned = true " +
           "AND a.isPublished = true ORDER BY a.publishedAt DESC")
    List<Announcement> findPinnedByTenantId(@Param("tenantId") UUID tenantId);

    Optional<Announcement> findByIdAndTenantId(UUID id, UUID tenantId);

    @Modifying
    @Query("UPDATE Announcement a SET a.viewCount = a.viewCount + 1 WHERE a.id = :id")
    void incrementViewCount(@Param("id") UUID id);

    @Query("SELECT COUNT(a) FROM Announcement a WHERE a.tenantId = :tenantId")
    long countByTenantId(@Param("tenantId") UUID tenantId);

    @Query("SELECT COUNT(a) FROM Announcement a WHERE a.tenantId = :tenantId AND a.isPublished = true")
    long countPublishedByTenantId(@Param("tenantId") UUID tenantId);
}
