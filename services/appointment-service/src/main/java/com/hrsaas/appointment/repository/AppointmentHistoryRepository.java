package com.hrsaas.appointment.repository;

import com.hrsaas.appointment.domain.entity.AppointmentHistory;
import com.hrsaas.appointment.domain.entity.AppointmentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface AppointmentHistoryRepository extends JpaRepository<AppointmentHistory, UUID> {

    @Query("SELECT h FROM AppointmentHistory h WHERE h.employeeId = :employeeId " +
           "ORDER BY h.effectiveDate DESC, h.createdAt DESC")
    List<AppointmentHistory> findByEmployeeId(@Param("employeeId") UUID employeeId);

    @Query("SELECT h FROM AppointmentHistory h WHERE h.employeeId = :employeeId " +
           "ORDER BY h.effectiveDate DESC")
    Page<AppointmentHistory> findByEmployeeId(
        @Param("employeeId") UUID employeeId,
        Pageable pageable);

    @Query("SELECT h FROM AppointmentHistory h WHERE h.employeeId = :employeeId " +
           "AND h.appointmentType = :appointmentType ORDER BY h.effectiveDate DESC")
    List<AppointmentHistory> findByEmployeeIdAndAppointmentType(
        @Param("employeeId") UUID employeeId,
        @Param("appointmentType") AppointmentType appointmentType);

    @Query("SELECT h FROM AppointmentHistory h WHERE h.tenantId = :tenantId " +
           "AND h.effectiveDate BETWEEN :startDate AND :endDate " +
           "ORDER BY h.effectiveDate DESC")
    List<AppointmentHistory> findByTenantIdAndEffectiveDateBetween(
        @Param("tenantId") UUID tenantId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);

    /**
     * 테넌트 전체 발령 이력 페이징 조회.
     * 테넌트 전체 범위 조회 시 대량 데이터 → 페이징 필수.
     */
    @Query("SELECT h FROM AppointmentHistory h WHERE h.tenantId = :tenantId " +
           "AND h.effectiveDate BETWEEN :startDate AND :endDate " +
           "ORDER BY h.effectiveDate DESC")
    Page<AppointmentHistory> findByTenantIdAndEffectiveDateBetween(
        @Param("tenantId") UUID tenantId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        Pageable pageable);

    @Query("SELECT h.appointmentType, COUNT(h) FROM AppointmentHistory h " +
           "WHERE h.tenantId = :tenantId " +
           "AND h.effectiveDate BETWEEN :startDate AND :endDate " +
           "GROUP BY h.appointmentType")
    List<Object[]> countByTenantIdAndEffectiveDateBetweenGroupByType(
        @Param("tenantId") UUID tenantId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);

    List<AppointmentHistory> findByDraftNumber(String draftNumber);
}
