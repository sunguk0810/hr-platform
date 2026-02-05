package com.hrsaas.organization.repository;

import com.hrsaas.organization.domain.entity.HeadcountPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HeadcountPlanRepository extends JpaRepository<HeadcountPlan, UUID> {

    @Query("SELECT p FROM HeadcountPlan p WHERE p.tenantId = :tenantId AND p.year = :year " +
           "ORDER BY p.departmentName ASC")
    List<HeadcountPlan> findByTenantIdAndYear(
        @Param("tenantId") UUID tenantId,
        @Param("year") Integer year);

    Optional<HeadcountPlan> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query("SELECT p FROM HeadcountPlan p WHERE p.tenantId = :tenantId AND p.year = :year " +
           "AND p.departmentId = :departmentId")
    Optional<HeadcountPlan> findByTenantIdAndYearAndDepartmentId(
        @Param("tenantId") UUID tenantId,
        @Param("year") Integer year,
        @Param("departmentId") UUID departmentId);

    @Query("SELECT p FROM HeadcountPlan p WHERE p.tenantId = :tenantId AND p.departmentId = :departmentId " +
           "ORDER BY p.year DESC")
    List<HeadcountPlan> findByTenantIdAndDepartmentId(
        @Param("tenantId") UUID tenantId,
        @Param("departmentId") UUID departmentId);

    boolean existsByTenantIdAndYearAndDepartmentId(UUID tenantId, Integer year, UUID departmentId);

    @Query("SELECT SUM(p.plannedCount) FROM HeadcountPlan p WHERE p.tenantId = :tenantId AND p.year = :year")
    Integer sumPlannedCountByTenantIdAndYear(
        @Param("tenantId") UUID tenantId,
        @Param("year") Integer year);

    @Query("SELECT SUM(p.currentCount) FROM HeadcountPlan p WHERE p.tenantId = :tenantId AND p.year = :year")
    Integer sumCurrentCountByTenantIdAndYear(
        @Param("tenantId") UUID tenantId,
        @Param("year") Integer year);
}
