package com.hrsaas.attendance.repository;

import com.hrsaas.attendance.domain.entity.Holiday;
import com.hrsaas.attendance.domain.entity.HolidayType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HolidayRepository extends JpaRepository<Holiday, UUID> {

    @Query("SELECT h FROM Holiday h WHERE h.tenantId = :tenantId AND h.year = :year " +
           "ORDER BY h.holidayDate ASC")
    List<Holiday> findByYear(@Param("tenantId") UUID tenantId, @Param("year") Integer year);

    @Query("SELECT h FROM Holiday h WHERE h.tenantId = :tenantId " +
           "AND h.holidayDate BETWEEN :startDate AND :endDate ORDER BY h.holidayDate ASC")
    List<Holiday> findByDateRange(
        @Param("tenantId") UUID tenantId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);

    @Query("SELECT h FROM Holiday h WHERE h.tenantId = :tenantId AND h.holidayDate = :date")
    Optional<Holiday> findByDate(@Param("tenantId") UUID tenantId, @Param("date") LocalDate date);

    @Query("SELECT h FROM Holiday h WHERE h.tenantId = :tenantId " +
           "AND h.year = :year AND h.holidayType = :holidayType ORDER BY h.holidayDate ASC")
    List<Holiday> findByYearAndType(
        @Param("tenantId") UUID tenantId,
        @Param("year") Integer year,
        @Param("holidayType") HolidayType holidayType);

    boolean existsByTenantIdAndHolidayDate(UUID tenantId, LocalDate holidayDate);

    @Query("SELECT COUNT(h) FROM Holiday h WHERE h.tenantId = :tenantId " +
           "AND h.holidayDate BETWEEN :startDate AND :endDate")
    long countByDateRange(
        @Param("tenantId") UUID tenantId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);
}
