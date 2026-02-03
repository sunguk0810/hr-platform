package com.hrsaas.tenant.repository;

import com.hrsaas.tenant.domain.entity.Tenant;
import com.hrsaas.tenant.domain.entity.TenantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {

    Optional<Tenant> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByBusinessNumber(String businessNumber);

    List<Tenant> findByStatus(TenantStatus status);
}
