package com.hrsaas.attendance.service.impl;

import com.hrsaas.attendance.domain.dto.request.CreateOvertimeRequest;
import com.hrsaas.attendance.domain.dto.response.OvertimeRequestResponse;
import com.hrsaas.attendance.domain.entity.OvertimeRequest;
import com.hrsaas.attendance.domain.entity.OvertimeStatus;
import com.hrsaas.attendance.repository.OvertimeRequestRepository;
import com.hrsaas.attendance.service.OvertimeService;
import com.hrsaas.attendance.domain.AttendanceErrorCode;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OvertimeServiceImpl implements OvertimeService {

    private final OvertimeRequestRepository overtimeRequestRepository;

    @Override
    @Transactional
    public OvertimeRequestResponse create(UUID employeeId, String employeeName,
                                          UUID departmentId, String departmentName,
                                          CreateOvertimeRequest request) {
        OvertimeRequest overtimeRequest = OvertimeRequest.builder()
            .employeeId(employeeId)
            .employeeName(employeeName)
            .departmentId(departmentId)
            .departmentName(departmentName)
            .overtimeDate(request.getOvertimeDate())
            .startTime(request.getStartTime())
            .endTime(request.getEndTime())
            .plannedHours(request.getPlannedHours())
            .reason(request.getReason())
            .build();

        OvertimeRequest saved = overtimeRequestRepository.save(overtimeRequest);
        log.info("Overtime request created: id={}, employeeId={}, date={}",
            saved.getId(), employeeId, request.getOvertimeDate());

        return OvertimeRequestResponse.from(saved);
    }

    @Override
    public OvertimeRequestResponse getById(UUID id) {
        OvertimeRequest request = findById(id);
        return OvertimeRequestResponse.from(request);
    }

    @Override
    public Page<OvertimeRequestResponse> getByEmployeeId(UUID employeeId, Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<OvertimeRequest> requests = overtimeRequestRepository.findByEmployeeId(tenantId, employeeId, pageable);

        return requests.map(OvertimeRequestResponse::from);
    }

    @Override
    public List<OvertimeRequestResponse> getByEmployeeIdAndStatus(UUID employeeId, OvertimeStatus status) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<OvertimeRequest> requests = overtimeRequestRepository.findByEmployeeIdAndStatus(
            tenantId, employeeId, status);

        return requests.stream()
            .map(OvertimeRequestResponse::from)
            .toList();
    }

    @Override
    public List<OvertimeRequestResponse> getByDepartmentIdAndStatus(UUID departmentId, OvertimeStatus status) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<OvertimeRequest> requests = overtimeRequestRepository.findByDepartmentIdAndStatus(
            tenantId, departmentId, status);

        return requests.stream()
            .map(OvertimeRequestResponse::from)
            .toList();
    }

    @Override
    public List<OvertimeRequestResponse> getByDateRange(LocalDate startDate, LocalDate endDate) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<OvertimeRequest> requests = overtimeRequestRepository.findByDateRange(tenantId, startDate, endDate);

        return requests.stream()
            .map(OvertimeRequestResponse::from)
            .toList();
    }

    @Override
    @Transactional
    public OvertimeRequestResponse approve(UUID id) {
        OvertimeRequest request = findById(id);
        request.approve();

        OvertimeRequest saved = overtimeRequestRepository.save(request);
        log.info("Overtime request approved: id={}", id);

        return OvertimeRequestResponse.from(saved);
    }

    @Override
    @Transactional
    public OvertimeRequestResponse reject(UUID id, String rejectionReason) {
        OvertimeRequest request = findById(id);
        request.reject(rejectionReason);

        OvertimeRequest saved = overtimeRequestRepository.save(request);
        log.info("Overtime request rejected: id={}", id);

        return OvertimeRequestResponse.from(saved);
    }

    @Override
    @Transactional
    public OvertimeRequestResponse cancel(UUID id) {
        OvertimeRequest request = findById(id);
        request.cancel();

        OvertimeRequest saved = overtimeRequestRepository.save(request);
        log.info("Overtime request canceled: id={}", id);

        return OvertimeRequestResponse.from(saved);
    }

    @Override
    @Transactional
    public OvertimeRequestResponse complete(UUID id, BigDecimal actualHours) {
        OvertimeRequest request = findById(id);
        request.complete(actualHours);

        OvertimeRequest saved = overtimeRequestRepository.save(request);
        log.info("Overtime request completed: id={}, actualHours={}", id, actualHours);

        return OvertimeRequestResponse.from(saved);
    }

    @Override
    public BigDecimal getTotalOvertimeHours(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        UUID tenantId = TenantContext.getCurrentTenant();
        BigDecimal total = overtimeRequestRepository.sumActualHoursByEmployeeIdAndDateRange(
            tenantId, employeeId, startDate, endDate);

        return total != null ? total : BigDecimal.ZERO;
    }

    private OvertimeRequest findById(UUID id) {
        return overtimeRequestRepository.findById(id)
            .orElseThrow(() -> new NotFoundException(AttendanceErrorCode.OVERTIME_NOT_FOUND, "초과근무 신청을 찾을 수 없습니다: " + id));
    }
}
