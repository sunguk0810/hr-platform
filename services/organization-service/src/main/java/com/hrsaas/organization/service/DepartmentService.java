package com.hrsaas.organization.service;

import com.hrsaas.organization.domain.dto.request.CreateDepartmentRequest;
import com.hrsaas.organization.domain.dto.request.UpdateDepartmentRequest;
import com.hrsaas.organization.domain.dto.response.DepartmentHistoryResponse;
import com.hrsaas.organization.domain.dto.response.DepartmentResponse;
import com.hrsaas.organization.domain.dto.response.DepartmentTreeResponse;
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

    /**
     * 전체 조직 변경 이력 조회 (페이징)
     */
    Page<DepartmentHistoryResponse> getOrganizationHistory(Pageable pageable);

    /**
     * 특정 부서 변경 이력 조회
     */
    List<DepartmentHistoryResponse> getDepartmentHistory(UUID departmentId);
}
