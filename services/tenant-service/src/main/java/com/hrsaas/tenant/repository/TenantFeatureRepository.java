package com.hrsaas.tenant.repository;

import com.hrsaas.tenant.domain.entity.TenantFeature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantFeatureRepository extends JpaRepository<TenantFeature, UUID> {

    Optional<TenantFeature> findByTenantIdAndFeatureCode(UUID tenantId, String featureCode);

    @Query("SELECT f FROM TenantFeature f WHERE f.tenantId = :tenantId ORDER BY f.featureCode ASC")
    List<TenantFeature> findAllByTenantId(@Param("tenantId") UUID tenantId);

    @Query("SELECT f FROM TenantFeature f WHERE f.tenantId = :tenantId AND f.isEnabled = true " +
           "ORDER BY f.featureCode ASC")
    List<TenantFeature> findEnabledByTenantId(@Param("tenantId") UUID tenantId);

    boolean existsByTenantIdAndFeatureCode(UUID tenantId, String featureCode);
}
