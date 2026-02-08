package com.hrsaas.tenant.repository;

import com.hrsaas.tenant.domain.entity.Tenant;
import com.hrsaas.tenant.domain.entity.TenantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID>, TenantRepositoryCustom {

    Optional<Tenant> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByBusinessNumber(String businessNumber);

    List<Tenant> findByStatus(TenantStatus status);

    List<Tenant> findByContractEndDate(LocalDate contractEndDate);

    List<Tenant> findByContractEndDateBeforeAndStatus(LocalDate contractEndDate, TenantStatus status);

    List<Tenant> findByContractEndDateBetween(LocalDate from, LocalDate to);
}
