package com.hrsaas.employee.service;

import com.hrsaas.employee.domain.dto.request.CreateEmployeeFamilyRequest;
import com.hrsaas.employee.domain.dto.request.UpdateEmployeeFamilyRequest;
import com.hrsaas.employee.domain.dto.response.EmployeeFamilyResponse;

import java.util.List;
import java.util.UUID;

public interface EmployeeFamilyService {

    EmployeeFamilyResponse create(UUID employeeId, CreateEmployeeFamilyRequest request);

    List<EmployeeFamilyResponse> getByEmployeeId(UUID employeeId);

    List<EmployeeFamilyResponse> getDependents(UUID employeeId);

    EmployeeFamilyResponse update(UUID employeeId, UUID familyId, UpdateEmployeeFamilyRequest request);

    void delete(UUID employeeId, UUID familyId);
}
