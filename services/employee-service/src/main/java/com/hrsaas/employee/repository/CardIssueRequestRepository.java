package com.hrsaas.employee.repository;

import com.hrsaas.employee.domain.entity.CardIssueRequest;
import com.hrsaas.employee.domain.entity.CardIssueRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CardIssueRequestRepository extends JpaRepository<CardIssueRequest, UUID> {

    Page<CardIssueRequest> findByTenantIdAndStatus(UUID tenantId, CardIssueRequestStatus status, Pageable pageable);

    Page<CardIssueRequest> findByTenantId(UUID tenantId, Pageable pageable);
}
