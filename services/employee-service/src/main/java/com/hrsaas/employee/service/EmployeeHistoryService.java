package com.hrsaas.employee.service;

import com.hrsaas.employee.domain.dto.request.CreateEmployeeHistoryRequest;
import com.hrsaas.employee.domain.dto.response.EmployeeHistoryResponse;
import com.hrsaas.employee.domain.entity.HistoryChangeType;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface EmployeeHistoryService {

    EmployeeHistoryResponse create(UUID employeeId, CreateEmployeeHistoryRequest request);

    List<EmployeeHistoryResponse> getByEmployeeId(UUID employeeId);

    List<EmployeeHistoryResponse> getByEmployeeIdAndChangeType(UUID employeeId, HistoryChangeType changeType);

    List<EmployeeHistoryResponse> getByEmployeeIdAndDateRange(UUID employeeId, LocalDate startDate, LocalDate endDate);
}
