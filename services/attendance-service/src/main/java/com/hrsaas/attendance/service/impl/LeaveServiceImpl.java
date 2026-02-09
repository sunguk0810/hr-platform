package com.hrsaas.attendance.service.impl;

import com.hrsaas.attendance.domain.AttendanceErrorCode;
import com.hrsaas.attendance.domain.dto.request.CreateLeaveRequest;
import com.hrsaas.attendance.domain.dto.response.LeaveBalanceResponse;
import com.hrsaas.attendance.domain.dto.response.LeaveRequestResponse;
import com.hrsaas.attendance.domain.entity.LeaveBalance;
import com.hrsaas.attendance.domain.entity.LeaveRequest;
import com.hrsaas.attendance.domain.entity.LeaveStatus;
import com.hrsaas.attendance.domain.entity.LeaveType;
import com.hrsaas.attendance.domain.event.LeaveRequestCreatedEvent;
import com.hrsaas.attendance.repository.LeaveBalanceRepository;
import com.hrsaas.attendance.repository.LeaveRequestRepository;
import com.hrsaas.attendance.service.LeaveService;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.ForbiddenException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LeaveServiceImpl implements LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final EventPublisher eventPublisher;

    @Override
    @Transactional
    public LeaveRequestResponse create(CreateLeaveRequest request, UUID employeeId, String employeeName,
                                        UUID departmentId, String departmentName) {
        UUID tenantId = TenantContext.getCurrentTenant();

        // 중복 휴가 체크
        List<LeaveRequest> overlapping = leaveRequestRepository.findOverlappingRequests(
            tenantId, employeeId, request.getStartDate(), request.getEndDate());
        if (!overlapping.isEmpty()) {
            throw new BusinessException(AttendanceErrorCode.LEAVE_OVERLAPPING, "해당 기간에 이미 신청된 휴가가 있습니다", HttpStatus.CONFLICT);
        }

        // 일수 계산
        BigDecimal daysCount = calculateDaysCount(request.getLeaveType(), request.getStartDate(), request.getEndDate());

        // 잔여 휴가 체크
        int year = request.getStartDate().getYear();
        LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndYearAndType(
            tenantId, employeeId, year, request.getLeaveType())
            .orElseThrow(() -> new NotFoundException(AttendanceErrorCode.LEAVE_NO_BALANCE, "휴가 잔여일 정보가 없습니다"));

        if (!balance.hasEnoughBalance(daysCount)) {
            throw new BusinessException(AttendanceErrorCode.LEAVE_INSUFFICIENT_BALANCE, "휴가 잔여일이 부족합니다. 잔여: " + balance.getAvailableDays() + "일", HttpStatus.BAD_REQUEST);
        }

        LeaveRequest leaveRequest = LeaveRequest.builder()
            .employeeId(employeeId)
            .employeeName(employeeName)
            .departmentId(departmentId)
            .departmentName(departmentName)
            .leaveType(request.getLeaveType())
            .startDate(request.getStartDate())
            .endDate(request.getEndDate())
            .daysCount(daysCount)
            .reason(request.getReason())
            .emergencyContact(request.getEmergencyContact())
            .handoverToId(request.getHandoverToId())
            .handoverToName(request.getHandoverToName())
            .handoverNotes(request.getHandoverNotes())
            .build();

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);

        // 잔여일 갱신 (pending)
        balance.addPendingDays(daysCount);
        leaveBalanceRepository.save(balance);

        if (request.isSubmitImmediately()) {
            // 결재 연동 이벤트 발행
            eventPublisher.publish(LeaveRequestCreatedEvent.of(saved));
            saved.submit(null); // 결재 문서 ID는 이벤트 핸들러에서 설정
            saved = leaveRequestRepository.save(saved);
        }

        log.info("Leave request created: id={}, employeeId={}, type={}, days={}",
            saved.getId(), employeeId, request.getLeaveType(), daysCount);
        return LeaveRequestResponse.from(saved);
    }

    @Override
    public LeaveRequestResponse getById(UUID id) {
        LeaveRequest leaveRequest = findById(id);
        return LeaveRequestResponse.from(leaveRequest);
    }

    @Override
    public PageResponse<LeaveRequestResponse> getMyLeaves(UUID employeeId, Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<LeaveRequest> page = leaveRequestRepository.findByEmployeeId(tenantId, employeeId, pageable);
        return PageResponse.from(page, page.getContent().stream()
            .map(LeaveRequestResponse::from)
            .toList());
    }

    @Override
    @Transactional
    public LeaveRequestResponse submit(UUID leaveId, UUID employeeId) {
        LeaveRequest leaveRequest = findById(leaveId);

        if (!leaveRequest.getEmployeeId().equals(employeeId)) {
            throw new ForbiddenException(AttendanceErrorCode.LEAVE_FORBIDDEN, "본인의 휴가 신청만 제출할 수 있습니다");
        }

        leaveRequest.submit(null);
        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);

        eventPublisher.publish(LeaveRequestCreatedEvent.of(saved));

        log.info("Leave request submitted: id={}", leaveId);
        return LeaveRequestResponse.from(saved);
    }

    @Override
    @Transactional
    public LeaveRequestResponse cancel(UUID leaveId, UUID employeeId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        LeaveRequest leaveRequest = findById(leaveId);

        if (!leaveRequest.getEmployeeId().equals(employeeId)) {
            throw new ForbiddenException(AttendanceErrorCode.LEAVE_FORBIDDEN, "본인의 휴가 신청만 취소할 수 있습니다");
        }

        LeaveStatus previousStatus = leaveRequest.getStatus();
        leaveRequest.cancel();
        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);

        // 잔여일 복구
        int year = leaveRequest.getStartDate().getYear();
        LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndYearAndType(
            tenantId, employeeId, year, leaveRequest.getLeaveType()).orElse(null);

        if (balance != null) {
            if (previousStatus == LeaveStatus.PENDING) {
                balance.releasePendingDays(leaveRequest.getDaysCount());
            } else if (previousStatus == LeaveStatus.APPROVED) {
                balance.releaseUsedDays(leaveRequest.getDaysCount());
            }
            leaveBalanceRepository.save(balance);
        }

        log.info("Leave request canceled: id={}", leaveId);
        return LeaveRequestResponse.from(saved);
    }

    @Override
    public List<LeaveBalanceResponse> getMyBalances(UUID employeeId, Integer year) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<LeaveBalance> balances = leaveBalanceRepository.findByEmployeeIdAndYear(tenantId, employeeId, year);
        return balances.stream()
            .map(LeaveBalanceResponse::from)
            .toList();
    }

    @Override
    @Transactional
    public void handleApprovalCompleted(UUID leaveId, boolean approved) {
        UUID tenantId = TenantContext.getCurrentTenant();
        LeaveRequest leaveRequest = findById(leaveId);

        if (approved) {
            leaveRequest.approve();

            // pending -> used 전환
            int year = leaveRequest.getStartDate().getYear();
            LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndYearAndType(
                tenantId, leaveRequest.getEmployeeId(), year, leaveRequest.getLeaveType()).orElse(null);

            if (balance != null) {
                balance.confirmUsedDays(leaveRequest.getDaysCount());
                leaveBalanceRepository.save(balance);
            }
        } else {
            leaveRequest.reject();

            // pending 일수 복구
            int year = leaveRequest.getStartDate().getYear();
            LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndYearAndType(
                tenantId, leaveRequest.getEmployeeId(), year, leaveRequest.getLeaveType()).orElse(null);

            if (balance != null) {
                balance.releasePendingDays(leaveRequest.getDaysCount());
                leaveBalanceRepository.save(balance);
            }
        }

        leaveRequestRepository.save(leaveRequest);
        log.info("Leave request {} {}: id={}", approved ? "approved" : "rejected", leaveId);
    }

    private LeaveRequest findById(UUID id) {
        return leaveRequestRepository.findById(id)
            .orElseThrow(() -> new NotFoundException(AttendanceErrorCode.LEAVE_NOT_FOUND, "휴가 신청을 찾을 수 없습니다: " + id));
    }

    private BigDecimal calculateDaysCount(LeaveType leaveType, LocalDate startDate, LocalDate endDate) {
        if (leaveType == LeaveType.HALF_DAY_AM || leaveType == LeaveType.HALF_DAY_PM) {
            return new BigDecimal("0.5");
        }
        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        return BigDecimal.valueOf(days);
    }
}
