package com.hrsaas.employee.repository;

import com.hrsaas.employee.domain.entity.EmployeeCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface EmployeeCertificateRepository extends JpaRepository<EmployeeCertificate, UUID> {

    @Query("SELECT c FROM EmployeeCertificate c WHERE c.employeeId = :employeeId " +
           "ORDER BY c.issueDate DESC")
    List<EmployeeCertificate> findByEmployeeId(@Param("employeeId") UUID employeeId);

    @Query("SELECT c FROM EmployeeCertificate c WHERE c.employeeId = :employeeId " +
           "AND (c.expiryDate IS NULL OR c.expiryDate >= :currentDate)")
    List<EmployeeCertificate> findValidCertificatesByEmployeeId(
        @Param("employeeId") UUID employeeId,
        @Param("currentDate") LocalDate currentDate);

    void deleteByEmployeeId(UUID employeeId);
}
