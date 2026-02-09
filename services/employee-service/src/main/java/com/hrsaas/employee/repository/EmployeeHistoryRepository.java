package com.hrsaas.employee.repository;

import com.hrsaas.employee.domain.entity.EmployeeHistory;
import com.hrsaas.employee.domain.entity.HistoryChangeType;
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
public interface EmployeeHistoryRepository extends JpaRepository<EmployeeHistory, UUID> {

    @Query("SELECT h FROM EmployeeHistory h WHERE h.employeeId = :employeeId " +
           "ORDER BY h.effectiveDate DESC, h.createdAt DESC")
    List<EmployeeHistory> findByEmployeeId(@Param("employeeId") UUID employeeId);

    @Query("SELECT h FROM EmployeeHistory h WHERE h.employeeId = :employeeId " +
           "AND h.changeType = :changeType ORDER BY h.effectiveDate DESC")
    List<EmployeeHistory> findByEmployeeIdAndChangeType(
        @Param("employeeId") UUID employeeId,
        @Param("changeType") HistoryChangeType changeType);

    @Query("SELECT h FROM EmployeeHistory h WHERE h.employeeId = :employeeId " +
           "AND h.effectiveDate BETWEEN :startDate AND :endDate ORDER BY h.effectiveDate DESC")
    List<EmployeeHistory> findByEmployeeIdAndDateRange(
        @Param("employeeId") UUID employeeId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);

    /**
     * 직원 변경 이력 페이징 조회.
     * 장기 재직자의 경우 이력이 많을 수 있음 → 페이징 지원.
     */
    @Query("SELECT h FROM EmployeeHistory h WHERE h.employeeId = :employeeId " +
           "ORDER BY h.effectiveDate DESC, h.createdAt DESC")
    Page<EmployeeHistory> findByEmployeeId(@Param("employeeId") UUID employeeId, Pageable pageable);
}
