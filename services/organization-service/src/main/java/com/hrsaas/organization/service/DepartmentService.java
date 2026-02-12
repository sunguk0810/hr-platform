package com.hrsaas.organization.service;

import com.hrsaas.organization.domain.dto.request.CreateDepartmentRequest;
import com.hrsaas.organization.domain.dto.request.DepartmentMergeRequest;
import com.hrsaas.organization.domain.dto.request.DepartmentSplitRequest;
import com.hrsaas.organization.domain.dto.request.OrgHistorySearchRequest;
import com.hrsaas.organization.domain.dto.request.UpdateDepartmentRequest;
import com.hrsaas.organization.domain.dto.response.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface DepartmentService {

    DepartmentResponse create(CreateDepartmentRequest request);

    DepartmentResponse getById(UUID id);

    List<DepartmentResponse> getAll();

    List<DepartmentTreeResponse> getTree();

    DepartmentResponse update(UUID id, UpdateDepartmentRequest request);

    void delete(UUID id);

    Page<DepartmentHistoryResponse> getOrganizationHistory(Pageable pageable);

    Page<DepartmentHistoryResponse> getOrganizationHistory(OrgHistorySearchRequest request, Pageable pageable);

    List<DepartmentHistoryResponse> getDepartmentHistory(UUID departmentId);

    /**
     * G06: 부서 통합
     */
    DepartmentMergeResponse merge(DepartmentMergeRequest request);

    /**
     * G06: 부서 분리
     */
    DepartmentSplitResponse split(DepartmentSplitRequest request);

    /**
     * G14: 조직도 조회
     */
    List<OrgChartNodeResponse> getOrgChart();
}
