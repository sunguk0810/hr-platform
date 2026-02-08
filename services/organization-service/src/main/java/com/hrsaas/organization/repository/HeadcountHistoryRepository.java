package com.hrsaas.organization.repository;

import com.hrsaas.organization.domain.entity.HeadcountHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface HeadcountHistoryRepository extends JpaRepository<HeadcountHistory, UUID> {

    @Query("SELECT h FROM HeadcountHistory h WHERE h.planId = :planId ORDER BY h.eventDate DESC")
    List<HeadcountHistory> findByPlanIdOrderByEventDateDesc(@Param("planId") UUID planId);

    @Query("SELECT h FROM HeadcountHistory h WHERE h.tenantId = :tenantId " +
           "AND h.eventDate BETWEEN :start AND :end ORDER BY h.eventDate DESC")
    List<HeadcountHistory> findByTenantIdAndEventDateBetween(
        @Param("tenantId") UUID tenantId,
        @Param("start") Instant start,
        @Param("end") Instant end);
}
