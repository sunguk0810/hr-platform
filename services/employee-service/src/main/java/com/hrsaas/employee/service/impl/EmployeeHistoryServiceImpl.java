package com.hrsaas.employee.service.impl;

import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.employee.domain.dto.request.CreateEmployeeHistoryRequest;
import com.hrsaas.employee.domain.dto.response.EmployeeHistoryResponse;
import com.hrsaas.employee.domain.entity.EmployeeHistory;
import com.hrsaas.employee.domain.entity.HistoryChangeType;
import com.hrsaas.employee.repository.EmployeeHistoryRepository;
import com.hrsaas.employee.repository.EmployeeRepository;
import com.hrsaas.employee.service.EmployeeHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeHistoryServiceImpl implements EmployeeHistoryService {

    private final EmployeeHistoryRepository employeeHistoryRepository;
    private final EmployeeRepository employeeRepository;

    @Override
    @Transactional
    public EmployeeHistoryResponse create(UUID employeeId, CreateEmployeeHistoryRequest request) {
        validateEmployeeExists(employeeId);

        EmployeeHistory history = EmployeeHistory.builder()
            .employeeId(employeeId)
            .changeType(request.getChangeType())
            .fromDepartmentId(request.getFromDepartmentId())
            .toDepartmentId(request.getToDepartmentId())
            .fromDepartmentName(request.getFromDepartmentName())
            .toDepartmentName(request.getToDepartmentName())
            .fromGradeCode(request.getFromGradeCode())
            .toGradeCode(request.getToGradeCode())
            .fromGradeName(request.getFromGradeName())
            .toGradeName(request.getToGradeName())
            .fromPositionCode(request.getFromPositionCode())
            .toPositionCode(request.getToPositionCode())
            .fromPositionName(request.getFromPositionName())
            .toPositionName(request.getToPositionName())
            .effectiveDate(request.getEffectiveDate())
            .orderNumber(request.getOrderNumber())
            .reason(request.getReason())
            .remarks(request.getRemarks())
            .build();

        EmployeeHistory saved = employeeHistoryRepository.save(history);
        log.info("Employee history created: employeeId={}, changeType={}", employeeId, request.getChangeType());

        return EmployeeHistoryResponse.from(saved);
    }

    @Override
    public List<EmployeeHistoryResponse> getByEmployeeId(UUID employeeId) {
        validateEmployeeExists(employeeId);
        List<EmployeeHistory> histories = employeeHistoryRepository.findByEmployeeId(employeeId);

        return histories.stream()
            .map(EmployeeHistoryResponse::from)
            .toList();
    }

    @Override
    public List<EmployeeHistoryResponse> getByEmployeeIdAndChangeType(UUID employeeId, HistoryChangeType changeType) {
        validateEmployeeExists(employeeId);
        List<EmployeeHistory> histories = employeeHistoryRepository.findByEmployeeIdAndChangeType(employeeId, changeType);

        return histories.stream()
            .map(EmployeeHistoryResponse::from)
            .toList();
    }

    @Override
    public List<EmployeeHistoryResponse> getByEmployeeIdAndDateRange(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        validateEmployeeExists(employeeId);
        List<EmployeeHistory> histories = employeeHistoryRepository.findByEmployeeIdAndDateRange(employeeId, startDate, endDate);

        return histories.stream()
            .map(EmployeeHistoryResponse::from)
            .toList();
    }

    private void validateEmployeeExists(UUID employeeId) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new NotFoundException("EMP_001", "직원을 찾을 수 없습니다: " + employeeId);
        }
    }
}
