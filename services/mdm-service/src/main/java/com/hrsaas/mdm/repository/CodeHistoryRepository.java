package com.hrsaas.mdm.repository;

import com.hrsaas.mdm.domain.entity.CodeAction;
import com.hrsaas.mdm.domain.entity.CodeHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface CodeHistoryRepository extends JpaRepository<CodeHistory, UUID> {

    @Query("SELECT h FROM CodeHistory h WHERE h.codeId = :codeId ORDER BY h.createdAt DESC")
    List<CodeHistory> findByCodeId(@Param("codeId") UUID codeId);

    @Query("SELECT h FROM CodeHistory h WHERE h.codeId = :codeId ORDER BY h.createdAt DESC")
    Page<CodeHistory> findByCodeId(@Param("codeId") UUID codeId, Pageable pageable);

    @Query("SELECT h FROM CodeHistory h " +
           "WHERE h.tenantId = :tenantId AND h.groupCode = :groupCode " +
           "ORDER BY h.createdAt DESC")
    List<CodeHistory> findByTenantIdAndGroupCode(
        @Param("tenantId") UUID tenantId,
        @Param("groupCode") String groupCode);

    @Query("SELECT h FROM CodeHistory h " +
           "WHERE h.tenantId = :tenantId AND h.action = :action " +
           "ORDER BY h.createdAt DESC")
    List<CodeHistory> findByTenantIdAndAction(
        @Param("tenantId") UUID tenantId,
        @Param("action") CodeAction action);

    @Query("SELECT h FROM CodeHistory h " +
           "WHERE h.codeId = :codeId AND h.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY h.createdAt DESC")
    List<CodeHistory> findByCodeIdAndDateRange(
        @Param("codeId") UUID codeId,
        @Param("startDate") Instant startDate,
        @Param("endDate") Instant endDate);

    @Query("SELECT h FROM CodeHistory h " +
           "WHERE h.tenantId = :tenantId AND h.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY h.createdAt DESC")
    Page<CodeHistory> findByTenantIdAndDateRange(
        @Param("tenantId") UUID tenantId,
        @Param("startDate") Instant startDate,
        @Param("endDate") Instant endDate,
        Pageable pageable);

    @Query("SELECT COUNT(h) FROM CodeHistory h WHERE h.codeId = :codeId")
    long countByCodeId(@Param("codeId") UUID codeId);

    @Query("SELECT h FROM CodeHistory h " +
           "WHERE h.changedById = :userId " +
           "ORDER BY h.createdAt DESC")
    List<CodeHistory> findByChangedById(@Param("userId") UUID userId);
}
