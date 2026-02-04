package com.hrsaas.attendance.service;

import com.hrsaas.attendance.domain.dto.request.CreateOvertimeRequest;
import com.hrsaas.attendance.domain.dto.response.OvertimeRequestResponse;
import com.hrsaas.attendance.domain.entity.OvertimeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface OvertimeService {

    OvertimeRequestResponse create(UUID employeeId, String employeeName,
                                   UUID departmentId, String departmentName,
                                   CreateOvertimeRequest request);

    OvertimeRequestResponse getById(UUID id);

    Page<OvertimeRequestResponse> getByEmployeeId(UUID employeeId, Pageable pageable);

    List<OvertimeRequestResponse> getByEmployeeIdAndStatus(UUID employeeId, OvertimeStatus status);

    List<OvertimeRequestResponse> getByDepartmentIdAndStatus(UUID departmentId, OvertimeStatus status);

    List<OvertimeRequestResponse> getByDateRange(LocalDate startDate, LocalDate endDate);

    OvertimeRequestResponse approve(UUID id);

    OvertimeRequestResponse reject(UUID id, String rejectionReason);

    OvertimeRequestResponse cancel(UUID id);

    OvertimeRequestResponse complete(UUID id, BigDecimal actualHours);

    BigDecimal getTotalOvertimeHours(UUID employeeId, LocalDate startDate, LocalDate endDate);
}
