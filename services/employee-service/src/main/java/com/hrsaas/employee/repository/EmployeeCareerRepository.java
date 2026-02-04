package com.hrsaas.employee.repository;

import com.hrsaas.employee.domain.entity.EmployeeCareer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EmployeeCareerRepository extends JpaRepository<EmployeeCareer, UUID> {

    @Query("SELECT c FROM EmployeeCareer c WHERE c.employeeId = :employeeId " +
           "ORDER BY c.startDate DESC")
    List<EmployeeCareer> findByEmployeeId(@Param("employeeId") UUID employeeId);

    void deleteByEmployeeId(UUID employeeId);
}
