package com.hrsaas.organization.repository;

import com.hrsaas.organization.domain.entity.HeadcountRequest;
import com.hrsaas.organization.domain.entity.HeadcountRequestStatus;
import com.hrsaas.organization.domain.entity.HeadcountRequestType;
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
public interface HeadcountRequestRepository extends JpaRepository<HeadcountRequest, UUID> {

    @Query("SELECT r FROM HeadcountRequest r WHERE r.tenantId = :tenantId " +
           "ORDER BY r.createdAt DESC")
    Page<HeadcountRequest> findAllByTenantId(
        @Param("tenantId") UUID tenantId,
        Pageable pageable);

    Optional<HeadcountRequest> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query("SELECT r FROM HeadcountRequest r WHERE r.tenantId = :tenantId AND r.status = :status " +
           "ORDER BY r.createdAt DESC")
    List<HeadcountRequest> findByTenantIdAndStatus(
        @Param("tenantId") UUID tenantId,
        @Param("status") HeadcountRequestStatus status);

    @Query("SELECT r FROM HeadcountRequest r WHERE r.tenantId = :tenantId AND r.departmentId = :departmentId " +
           "ORDER BY r.createdAt DESC")
    List<HeadcountRequest> findByTenantIdAndDepartmentId(
        @Param("tenantId") UUID tenantId,
        @Param("departmentId") UUID departmentId);

    @Query("SELECT r FROM HeadcountRequest r WHERE r.tenantId = :tenantId AND r.type = :type " +
           "ORDER BY r.createdAt DESC")
    List<HeadcountRequest> findByTenantIdAndType(
        @Param("tenantId") UUID tenantId,
        @Param("type") HeadcountRequestType type);

    @Query("SELECT r FROM HeadcountRequest r WHERE r.tenantId = :tenantId AND r.requesterId = :requesterId " +
           "ORDER BY r.createdAt DESC")
    List<HeadcountRequest> findByTenantIdAndRequesterId(
        @Param("tenantId") UUID tenantId,
        @Param("requesterId") UUID requesterId);

    @Query("SELECT COUNT(r) FROM HeadcountRequest r WHERE r.tenantId = :tenantId AND r.status = :status")
    long countByTenantIdAndStatus(
        @Param("tenantId") UUID tenantId,
        @Param("status") HeadcountRequestStatus status);
}
