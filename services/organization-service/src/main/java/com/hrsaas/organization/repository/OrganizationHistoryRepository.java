package com.hrsaas.organization.repository;

import com.hrsaas.organization.domain.entity.OrganizationHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrganizationHistoryRepository extends JpaRepository<OrganizationHistory, UUID>, JpaSpecificationExecutor<OrganizationHistory> {

    @Query("SELECT h FROM OrganizationHistory h WHERE h.tenantId = :tenantId ORDER BY h.eventDate DESC")
    Page<OrganizationHistory> findByTenantIdOrderByEventDateDesc(
        @Param("tenantId") UUID tenantId, Pageable pageable);

    @Query("SELECT h FROM OrganizationHistory h WHERE h.departmentId = :departmentId ORDER BY h.eventDate DESC")
    List<OrganizationHistory> findByDepartmentIdOrderByEventDateDesc(
        @Param("departmentId") UUID departmentId);

    /**
     * 부서별 조직 변경 이력 페이징 조회.
     * 장기간 이력 → 페이징 필수.
     */
    @Query("SELECT h FROM OrganizationHistory h WHERE h.departmentId = :departmentId ORDER BY h.eventDate DESC")
    Page<OrganizationHistory> findByDepartmentIdOrderByEventDateDesc(
        @Param("departmentId") UUID departmentId, Pageable pageable);
}
