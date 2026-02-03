package com.hrsaas.employee.service;

import com.hrsaas.common.response.PageResponse;
import com.hrsaas.employee.domain.dto.request.CreateEmployeeRequest;
import com.hrsaas.employee.domain.dto.request.EmployeeSearchCondition;
import com.hrsaas.employee.domain.dto.request.UpdateEmployeeRequest;
import com.hrsaas.employee.domain.dto.response.EmployeeResponse;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface EmployeeService {

    EmployeeResponse create(CreateEmployeeRequest request);

    EmployeeResponse getById(UUID id);

    EmployeeResponse getByEmployeeNumber(String employeeNumber);

    PageResponse<EmployeeResponse> search(EmployeeSearchCondition condition, Pageable pageable);

    EmployeeResponse update(UUID id, UpdateEmployeeRequest request);

    EmployeeResponse resign(UUID id, String resignDate);

    void delete(UUID id);
}
