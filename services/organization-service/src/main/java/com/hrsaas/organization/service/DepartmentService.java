package com.hrsaas.organization.service;

import com.hrsaas.organization.domain.dto.request.CreateDepartmentRequest;
import com.hrsaas.organization.domain.dto.request.UpdateDepartmentRequest;
import com.hrsaas.organization.domain.dto.response.DepartmentResponse;
import com.hrsaas.organization.domain.dto.response.DepartmentTreeResponse;

import java.util.List;
import java.util.UUID;

public interface DepartmentService {

    DepartmentResponse create(CreateDepartmentRequest request);

    DepartmentResponse getById(UUID id);

    List<DepartmentResponse> getAll();

    List<DepartmentTreeResponse> getTree();

    DepartmentResponse update(UUID id, UpdateDepartmentRequest request);

    void delete(UUID id);
}
