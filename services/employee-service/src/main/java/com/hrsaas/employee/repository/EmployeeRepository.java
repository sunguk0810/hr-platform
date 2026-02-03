package com.hrsaas.employee.repository;

import com.hrsaas.employee.domain.entity.Employee;
import com.hrsaas.employee.domain.entity.EmployeeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

    Optional<Employee> findByEmployeeNumberAndTenantId(String employeeNumber, UUID tenantId);

    Optional<Employee> findByEmailAndTenantId(String email, UUID tenantId);

    Optional<Employee> findByUserIdAndTenantId(UUID userId, UUID tenantId);

    @Query("SELECT e FROM Employee e WHERE e.tenantId = :tenantId " +
           "AND (:status IS NULL OR e.status = :status) " +
           "AND (:departmentId IS NULL OR e.departmentId = :departmentId) " +
           "AND (:name IS NULL OR e.name LIKE %:name%)")
    Page<Employee> search(
        @Param("tenantId") UUID tenantId,
        @Param("status") EmployeeStatus status,
        @Param("departmentId") UUID departmentId,
        @Param("name") String name,
        Pageable pageable);

    List<Employee> findByDepartmentIdAndStatus(UUID departmentId, EmployeeStatus status);

    boolean existsByEmployeeNumberAndTenantId(String employeeNumber, UUID tenantId);

    boolean existsByEmailAndTenantId(String email, UUID tenantId);
}
