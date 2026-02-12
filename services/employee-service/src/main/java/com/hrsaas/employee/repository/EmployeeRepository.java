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

    @Query(value = "SELECT * FROM hr_core.employee e WHERE e.tenant_id = :tenantId " +
           "AND (:status::TEXT IS NULL OR e.status = :status::TEXT) " +
           "AND (:departmentId::UUID IS NULL OR e.department_id = :departmentId::UUID) " +
           "AND (:name IS NULL OR e.name ILIKE '%' || :name || '%')",
           countQuery = "SELECT COUNT(*) FROM hr_core.employee e WHERE e.tenant_id = :tenantId " +
           "AND (:status::TEXT IS NULL OR e.status = :status::TEXT) " +
           "AND (:departmentId::UUID IS NULL OR e.department_id = :departmentId::UUID) " +
           "AND (:name IS NULL OR e.name ILIKE '%' || :name || '%')",
           nativeQuery = true)
    Page<Employee> search(
        @Param("tenantId") UUID tenantId,
        @Param("status") String status,
        @Param("departmentId") UUID departmentId,
        @Param("name") String name,
        Pageable pageable);

    List<Employee> findByDepartmentIdAndStatus(UUID departmentId, EmployeeStatus status);

    boolean existsByEmployeeNumberAndTenantId(String employeeNumber, UUID tenantId);

    boolean existsByEmailAndTenantId(String email, UUID tenantId);

    long countByDepartmentIdAndTenantId(UUID departmentId, UUID tenantId);

    long countByPositionCodeAndTenantId(String positionCode, UUID tenantId);

    long countByJobTitleCodeAndTenantId(String jobTitleCode, UUID tenantId);

    @Query("SELECT e.departmentId, COUNT(e) FROM Employee e WHERE e.tenantId = :tenantId AND e.status = 'ACTIVE' GROUP BY e.departmentId")
    List<Object[]> countByDepartmentGrouped(@Param("tenantId") UUID tenantId);

    @Query(value = "SELECT * FROM hr_core.employee e WHERE e.tenant_id = :tenantId " +
           "AND e.status = 'ACTIVE' AND e.birth_date IS NOT NULL " +
           "AND (EXTRACT(MONTH FROM e.birth_date) * 100 + EXTRACT(DAY FROM e.birth_date)) " +
           "BETWEEN :startMonthDay AND :endMonthDay " +
           "ORDER BY EXTRACT(MONTH FROM e.birth_date), EXTRACT(DAY FROM e.birth_date)",
           nativeQuery = true)
    List<Employee> findUpcomingBirthdays(@Param("tenantId") UUID tenantId,
                                         @Param("startMonthDay") int startMonthDay,
                                         @Param("endMonthDay") int endMonthDay);

    @Query("SELECT e FROM Employee e WHERE e.tenantId = :tenantId " +
           "AND e.status = 'ACTIVE' " +
           "AND (:keyword IS NULL OR e.name LIKE %:keyword% OR e.employeeNumber LIKE %:keyword%)")
    Page<Employee> searchByKeyword(
        @Param("tenantId") UUID tenantId,
        @Param("keyword") String keyword,
        Pageable pageable);

    long countByTenantId(UUID tenantId);

    long countByTenantIdAndStatus(UUID tenantId, EmployeeStatus status);

    @Query("SELECT COUNT(e) FROM Employee e WHERE e.tenantId = :tenantId " +
           "AND e.hireDate >= :startDate AND e.hireDate <= :endDate")
    long countNewHires(@Param("tenantId") UUID tenantId,
                       @Param("startDate") java.time.LocalDate startDate,
                       @Param("endDate") java.time.LocalDate endDate);

    @Query("SELECT COUNT(e) FROM Employee e WHERE e.tenantId = :tenantId " +
           "AND e.resignDate >= :startDate AND e.resignDate <= :endDate")
    long countResigned(@Param("tenantId") UUID tenantId,
                       @Param("startDate") java.time.LocalDate startDate,
                       @Param("endDate") java.time.LocalDate endDate);

    /**
     * Finds the most recently resigned employee matching the given criteria.
     * Used for employee number reuse logic when rehiring.
     *
     * @param tenantId  the tenant ID
     * @param name      the employee name
     * @param birthDate the employee birth date
     * @param status    the employee status (typically RESIGNED)
     * @return the most recent matching employee, if any
     */
    Optional<Employee> findTopByTenantIdAndNameAndBirthDateAndStatusOrderByResignDateDesc(
        UUID tenantId, String name, java.time.LocalDate birthDate, EmployeeStatus status);
}
