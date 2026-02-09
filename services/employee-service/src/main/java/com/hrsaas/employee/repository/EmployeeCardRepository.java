package com.hrsaas.employee.repository;

import com.hrsaas.employee.domain.entity.CardStatus;
import com.hrsaas.employee.domain.entity.EmployeeCard;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeCardRepository extends JpaRepository<EmployeeCard, UUID> {

    Optional<EmployeeCard> findByEmployeeIdAndStatus(UUID employeeId, CardStatus status);

    Page<EmployeeCard> findByTenantIdAndStatus(UUID tenantId, CardStatus status, Pageable pageable);

    Page<EmployeeCard> findByTenantId(UUID tenantId, Pageable pageable);

    Optional<EmployeeCard> findTopByTenantIdOrderByCardNumberDesc(UUID tenantId);
}
