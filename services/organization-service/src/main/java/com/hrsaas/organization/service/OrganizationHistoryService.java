package com.hrsaas.organization.service;

import com.hrsaas.organization.domain.dto.request.OrgHistorySearchRequest;
import com.hrsaas.organization.domain.dto.response.DepartmentHistoryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface OrganizationHistoryService {

    void recordEvent(String eventType, UUID departmentId, String departmentName,
                     String title, String description, String prevValue, String newValue,
                     String metadata);

    Page<DepartmentHistoryResponse> getOrganizationHistory(Pageable pageable);

    Page<DepartmentHistoryResponse> getOrganizationHistory(OrgHistorySearchRequest request, Pageable pageable);

    List<DepartmentHistoryResponse> getDepartmentHistory(UUID departmentId);
}
