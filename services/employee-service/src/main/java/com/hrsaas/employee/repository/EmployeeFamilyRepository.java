package com.hrsaas.employee.repository;

import com.hrsaas.employee.domain.entity.EmployeeFamily;
import com.hrsaas.employee.domain.entity.FamilyRelationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EmployeeFamilyRepository extends JpaRepository<EmployeeFamily, UUID> {

    List<EmployeeFamily> findByEmployeeId(UUID employeeId);

    @Query("SELECT f FROM EmployeeFamily f WHERE f.employeeId = :employeeId " +
           "AND f.relation = :relation")
    List<EmployeeFamily> findByEmployeeIdAndRelation(
        @Param("employeeId") UUID employeeId,
        @Param("relation") FamilyRelationType relation);

    @Query("SELECT f FROM EmployeeFamily f WHERE f.employeeId = :employeeId " +
           "AND f.isDependent = true")
    List<EmployeeFamily> findDependentsByEmployeeId(@Param("employeeId") UUID employeeId);

    void deleteByEmployeeId(UUID employeeId);
}
