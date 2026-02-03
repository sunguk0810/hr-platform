package com.hrsaas.organization.repository;

import com.hrsaas.organization.domain.entity.Department;
import com.hrsaas.organization.domain.entity.DepartmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, UUID> {

    Optional<Department> findByCodeAndTenantId(String code, UUID tenantId);

    @Query("SELECT d FROM Department d WHERE d.tenantId = :tenantId AND d.parent IS NULL " +
           "AND d.status = :status ORDER BY d.sortOrder ASC")
    List<Department> findRootDepartments(
        @Param("tenantId") UUID tenantId,
        @Param("status") DepartmentStatus status);

    @Query("SELECT d FROM Department d WHERE d.tenantId = :tenantId " +
           "AND d.status = :status ORDER BY d.level ASC, d.sortOrder ASC")
    List<Department> findAllByTenantAndStatus(
        @Param("tenantId") UUID tenantId,
        @Param("status") DepartmentStatus status);

    @Query("SELECT d FROM Department d WHERE d.parent.id = :parentId " +
           "AND d.status = :status ORDER BY d.sortOrder ASC")
    List<Department> findByParentId(
        @Param("parentId") UUID parentId,
        @Param("status") DepartmentStatus status);

    boolean existsByCodeAndTenantId(String code, UUID tenantId);
}
