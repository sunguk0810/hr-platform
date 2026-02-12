package com.hrsaas.attendance.service.impl;

import com.hrsaas.attendance.domain.AttendanceErrorCode;
import com.hrsaas.attendance.domain.dto.request.CreateLeaveRequest;
import com.hrsaas.attendance.domain.dto.response.*;
import com.hrsaas.attendance.domain.entity.LeaveBalance;
import com.hrsaas.attendance.domain.entity.LeaveRequest;
import com.hrsaas.attendance.domain.entity.LeaveStatus;
import com.hrsaas.attendance.domain.entity.LeaveType;
import com.hrsaas.attendance.domain.entity.LeaveUnit;
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
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

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

        // Handle hourly leave
        LeaveUnit leaveUnit = request.getLeaveUnit() != null ? request.getLeaveUnit() : LeaveUnit.DAY;
        BigDecimal hoursCount = request.getHoursCount();

        if (leaveUnit == LeaveUnit.HOUR) {
            if (hoursCount == null || hoursCount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessException(AttendanceErrorCode.LEAVE_INVALID_HOURS,
                    "시간 단위 휴가는 시간 입력이 필수입니다", HttpStatus.BAD_REQUEST);
            }
        }

        // 잔여 휴가 체크
        int year = request.getStartDate().getYear();
        LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndYearAndType(
            tenantId, employeeId, year, request.getLeaveType())
            .orElseThrow(() -> new NotFoundException(AttendanceErrorCode.LEAVE_NO_BALANCE, "휴가 잔여일 정보가 없습니다"));

        if (leaveUnit != LeaveUnit.HOUR && !balance.hasEnoughBalance(daysCount)) {
            throw new BusinessException(AttendanceErrorCode.LEAVE_INSUFFICIENT_BALANCE, "휴가 잔여일이 부족합니다. 잔여: " + balance.getAvailableDays() + "일", HttpStatus.BAD_REQUEST);
        }

        LeaveRequest leaveRequest = LeaveRequest.builder()
            .employeeId(employeeId)
            .employeeName(employeeName)
            .departmentId(departmentId)
            .departmentName(departmentName)
            .leaveType(request.getLeaveType())
            .leaveUnit(leaveUnit)
            .hoursCount(hoursCount)
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

        // 잔여일/시간 갱신 (pending)
        if (leaveUnit == LeaveUnit.HOUR) {
            balance.addPendingHours(hoursCount);
        } else {
            balance.addPendingDays(daysCount);
        }
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
    public LeaveRequestResponse getById(UUID id, UUID userId, Collection<String> roles) {
        LeaveRequest leaveRequest = findById(id);

        boolean isAdmin = roles != null && roles.stream()
            .anyMatch(role -> "HR_ADMIN".equals(role) || "TENANT_ADMIN".equals(role) || "SUPER_ADMIN".equals(role));

        if (!leaveRequest.getEmployeeId().equals(userId) && !isAdmin) {
            throw new ForbiddenException(AttendanceErrorCode.LEAVE_FORBIDDEN, "본인의 휴가 신청 내역만 조회할 수 있습니다");
        }

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
                if (leaveRequest.getLeaveUnit() == LeaveUnit.HOUR) {
                    balance.releasePendingHours(leaveRequest.getHoursCount());
                } else {
                    balance.releasePendingDays(leaveRequest.getDaysCount());
                }
            } else if (previousStatus == LeaveStatus.APPROVED) {
                if (leaveRequest.getLeaveUnit() == LeaveUnit.HOUR) {
                    balance.releaseUsedHours(leaveRequest.getHoursCount());
                } else {
                    balance.releaseUsedDays(leaveRequest.getDaysCount());
                }
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
                if (leaveRequest.getLeaveUnit() == LeaveUnit.HOUR) {
                    balance.confirmUsedHours(leaveRequest.getHoursCount());
                } else {
                    balance.confirmUsedDays(leaveRequest.getDaysCount());
                }
                leaveBalanceRepository.save(balance);
            }
        } else {
            leaveRequest.reject();

            // pending 일수/시간 복구
            int year = leaveRequest.getStartDate().getYear();
            LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndYearAndType(
                tenantId, leaveRequest.getEmployeeId(), year, leaveRequest.getLeaveType()).orElse(null);

            if (balance != null) {
                if (leaveRequest.getLeaveUnit() == LeaveUnit.HOUR) {
                    balance.releasePendingHours(leaveRequest.getHoursCount());
                } else {
                    balance.releasePendingDays(leaveRequest.getDaysCount());
                }
                leaveBalanceRepository.save(balance);
            }
        }

        leaveRequestRepository.save(leaveRequest);
        log.info("Leave request {} {}: id={}", approved ? "approved" : "rejected", leaveId);
    }

    // ===== Admin APIs =====

    @Override
    public PageResponse<PendingLeaveResponse> getPendingLeaves(UUID departmentId, LeaveType leaveType, Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();

        Page<LeaveRequest> page;
        if (departmentId != null && leaveType != null) {
            page = leaveRequestRepository.findPendingByDepartmentAndLeaveType(tenantId, departmentId, leaveType, pageable);
        } else if (departmentId != null) {
            page = leaveRequestRepository.findPendingByDepartment(tenantId, departmentId, pageable);
        } else if (leaveType != null) {
            page = leaveRequestRepository.findPendingByLeaveType(tenantId, leaveType, pageable);
        } else {
            page = leaveRequestRepository.findPending(tenantId, pageable);
        }

        // 배치 조회로 N+1 문제 해결: 페이지 내 모든 직원의 잔여일을 한 번에 조회
        List<LeaveRequest> requests = page.getContent();
        int year = LocalDate.now().getYear();
        List<UUID> employeeIds = requests.stream()
            .map(LeaveRequest::getEmployeeId)
            .distinct()
            .toList();

        Map<String, BigDecimal> balanceMap = Map.of();
        if (!employeeIds.isEmpty()) {
            List<LeaveBalance> balances = leaveBalanceRepository.findByEmployeeIdsAndYear(
                tenantId, employeeIds, year);
            balanceMap = balances.stream()
                .collect(Collectors.toMap(
                    b -> b.getEmployeeId() + ":" + b.getLeaveType(),
                    LeaveBalance::getAvailableDays,
                    (a, b) -> a));
        }

        Map<String, BigDecimal> finalBalanceMap = balanceMap;
        List<PendingLeaveResponse> content = requests.stream()
            .map(request -> {
                String key = request.getEmployeeId() + ":" + request.getLeaveType();
                BigDecimal remainingDays = finalBalanceMap.getOrDefault(key, BigDecimal.ZERO);
                boolean isUrgent = request.getStartDate().isBefore(LocalDate.now().plusDays(4));
                return PendingLeaveResponse.from(request, remainingDays, isUrgent);
            })
            .toList();

        return PageResponse.from(page, content);
    }

    @Override
    public PendingLeaveSummaryResponse getPendingSummary() {
        UUID tenantId = TenantContext.getCurrentTenant();

        long totalPending = leaveRequestRepository.countPending(tenantId);
        long urgentCount = leaveRequestRepository.countUrgentPending(tenantId, LocalDate.now().plusDays(3));

        LocalDate monday = LocalDate.now().with(DayOfWeek.MONDAY);
        Instant weekStart = monday.atStartOfDay(ZoneId.systemDefault()).toInstant();
        long thisWeekCount = leaveRequestRepository.countPendingThisWeek(tenantId, weekStart);

        return PendingLeaveSummaryResponse.builder()
            .totalPending(totalPending)
            .urgentCount(urgentCount)
            .thisWeekCount(thisWeekCount)
            .build();
    }

    @Override
    @Transactional
    public LeaveRequestResponse adminApprove(UUID leaveId, String comment, UUID adminId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        LeaveRequest leaveRequest = findById(leaveId);

        if (leaveRequest.getStatus() != LeaveStatus.PENDING) {
            throw new BusinessException(AttendanceErrorCode.LEAVE_INVALID_STATUS,
                "승인 대기 상태의 신청만 승인할 수 있습니다", HttpStatus.BAD_REQUEST);
        }

        leaveRequest.approve();

        // pending -> used 전환
        int year = leaveRequest.getStartDate().getYear();
        LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndYearAndType(
            tenantId, leaveRequest.getEmployeeId(), year, leaveRequest.getLeaveType()).orElse(null);

        if (balance != null) {
            if (leaveRequest.getLeaveUnit() == LeaveUnit.HOUR) {
                balance.confirmUsedHours(leaveRequest.getHoursCount());
            } else {
                balance.confirmUsedDays(leaveRequest.getDaysCount());
            }
            leaveBalanceRepository.save(balance);
        }

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        log.info("Leave request admin approved: id={}, adminId={}", leaveId, adminId);
        return LeaveRequestResponse.from(saved);
    }

    @Override
    @Transactional
    public LeaveRequestResponse adminReject(UUID leaveId, String reason, UUID adminId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        LeaveRequest leaveRequest = findById(leaveId);

        if (leaveRequest.getStatus() != LeaveStatus.PENDING) {
            throw new BusinessException(AttendanceErrorCode.LEAVE_INVALID_STATUS,
                "승인 대기 상태의 신청만 반려할 수 있습니다", HttpStatus.BAD_REQUEST);
        }

        leaveRequest.reject();

        // pending 일수/시간 복구
        int year = leaveRequest.getStartDate().getYear();
        LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndYearAndType(
            tenantId, leaveRequest.getEmployeeId(), year, leaveRequest.getLeaveType()).orElse(null);

        if (balance != null) {
            if (leaveRequest.getLeaveUnit() == LeaveUnit.HOUR) {
                balance.releasePendingHours(leaveRequest.getHoursCount());
            } else {
                balance.releasePendingDays(leaveRequest.getDaysCount());
            }
            leaveBalanceRepository.save(balance);
        }

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        log.info("Leave request admin rejected: id={}, adminId={}, reason={}", leaveId, adminId, reason);
        return LeaveRequestResponse.from(saved);
    }

    @Override
    @Transactional
    public BulkOperationResponse bulkApprove(List<UUID> ids, String comment, UUID adminId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        int successCount = 0;
        List<String> errors = new ArrayList<>();

        // 배치 로드: 모든 LeaveRequest를 한 번에 조회
        List<LeaveRequest> requests = leaveRequestRepository.findAllById(ids);
        Map<UUID, LeaveRequest> requestMap = requests.stream()
            .collect(Collectors.toMap(LeaveRequest::getId, r -> r));

        // 배치 LeaveBalance 조회: 관련 직원의 잔여일을 한 번에 조드
        List<UUID> employeeIds = requests.stream()
            .map(LeaveRequest::getEmployeeId).distinct().toList();
        int year = LocalDate.now().getYear();
        Map<String, LeaveBalance> balanceMap = leaveBalanceRepository
            .findByEmployeeIdsAndYear(tenantId, employeeIds, year).stream()
            .collect(Collectors.toMap(
                b -> b.getEmployeeId() + ":" + b.getLeaveType(),
                b -> b, (a, b) -> a));

        List<LeaveRequest> toSaveRequests = new ArrayList<>();
        List<LeaveBalance> toSaveBalances = new ArrayList<>();

        for (UUID id : ids) {
            try {
                LeaveRequest request = requestMap.get(id);
                if (request == null) {
                    errors.add(id + ": 휴가 신청을 찾을 수 없습니다");
                    continue;
                }
                if (request.getStatus() != LeaveStatus.PENDING) {
                    errors.add(id + ": 승인 대기 상태의 신청만 승인할 수 있습니다");
                    continue;
                }

                request.approve();
                toSaveRequests.add(request);

                // pending -> used 전환
                String key = request.getEmployeeId() + ":" + request.getLeaveType();
                LeaveBalance balance = balanceMap.get(key);
                if (balance != null) {
                    if (request.getLeaveUnit() == LeaveUnit.HOUR) {
                        balance.confirmUsedHours(request.getHoursCount());
                    } else {
                        balance.confirmUsedDays(request.getDaysCount());
                    }
                    toSaveBalances.add(balance);
                }

                successCount++;
            } catch (Exception e) {
                errors.add(id + ": " + e.getMessage());
            }
        }

        // 배치 저장
        if (!toSaveRequests.isEmpty()) leaveRequestRepository.saveAll(toSaveRequests);
        if (!toSaveBalances.isEmpty()) leaveBalanceRepository.saveAll(toSaveBalances);

        log.info("Bulk approve completed: success={}, failed={}, adminId={}", successCount, errors.size(), adminId);

        return BulkOperationResponse.builder()
            .successCount(successCount)
            .failedCount(errors.size())
            .errors(errors)
            .build();
    }

    @Override
    @Transactional
    public BulkOperationResponse bulkReject(List<UUID> ids, String reason, UUID adminId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        int successCount = 0;
        List<String> errors = new ArrayList<>();

        // 배치 로드: 모든 LeaveRequest를 한 번에 조회
        List<LeaveRequest> requests = leaveRequestRepository.findAllById(ids);
        Map<UUID, LeaveRequest> requestMap = requests.stream()
            .collect(Collectors.toMap(LeaveRequest::getId, r -> r));

        // 배치 LeaveBalance 조회
        List<UUID> employeeIds = requests.stream()
            .map(LeaveRequest::getEmployeeId).distinct().toList();
        int year = LocalDate.now().getYear();
        Map<String, LeaveBalance> balanceMap = leaveBalanceRepository
            .findByEmployeeIdsAndYear(tenantId, employeeIds, year).stream()
            .collect(Collectors.toMap(
                b -> b.getEmployeeId() + ":" + b.getLeaveType(),
                b -> b, (a, b) -> a));

        List<LeaveRequest> toSaveRequests = new ArrayList<>();
        List<LeaveBalance> toSaveBalances = new ArrayList<>();

        for (UUID id : ids) {
            try {
                LeaveRequest request = requestMap.get(id);
                if (request == null) {
                    errors.add(id + ": 휴가 신청을 찾을 수 없습니다");
                    continue;
                }
                if (request.getStatus() != LeaveStatus.PENDING) {
                    errors.add(id + ": 승인 대기 상태의 신청만 반려할 수 있습니다");
                    continue;
                }

                request.reject();
                toSaveRequests.add(request);

                // pending 일수/시간 복구
                String key = request.getEmployeeId() + ":" + request.getLeaveType();
                LeaveBalance balance = balanceMap.get(key);
                if (balance != null) {
                    if (request.getLeaveUnit() == LeaveUnit.HOUR) {
                        balance.releasePendingHours(request.getHoursCount());
                    } else {
                        balance.releasePendingDays(request.getDaysCount());
                    }
                    toSaveBalances.add(balance);
                }

                successCount++;
            } catch (Exception e) {
                errors.add(id + ": " + e.getMessage());
            }
        }

        // 배치 저장
        if (!toSaveRequests.isEmpty()) leaveRequestRepository.saveAll(toSaveRequests);
        if (!toSaveBalances.isEmpty()) leaveBalanceRepository.saveAll(toSaveBalances);

        log.info("Bulk reject completed: success={}, failed={}, adminId={}", successCount, errors.size(), adminId);

        return BulkOperationResponse.builder()
            .successCount(successCount)
            .failedCount(errors.size())
            .errors(errors)
            .build();
    }

    @Override
    public List<LeaveBalanceResponse> getBalanceByType(UUID employeeId, Integer year) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<LeaveBalance> balances = leaveBalanceRepository.findByEmployeeIdAndYear(tenantId, employeeId, year);
        return balances.stream()
            .map(LeaveBalanceResponse::from)
            .toList();
    }

    // ===== Calendar API =====

    @Override
    public List<LeaveCalendarEventResponse> getCalendarEvents(LocalDate startDate, LocalDate endDate, UUID departmentId) {
        UUID tenantId = TenantContext.getCurrentTenant();

        List<LeaveRequest> events;
        if (departmentId != null) {
            events = leaveRequestRepository.findCalendarEventsByDepartment(tenantId, departmentId, startDate, endDate);
        } else {
            events = leaveRequestRepository.findCalendarEvents(tenantId, startDate, endDate);
        }

        return events.stream()
            .map(LeaveCalendarEventResponse::from)
            .toList();
    }

    // ===== Private helpers =====

    private BigDecimal getEmployeeRemainingDays(UUID tenantId, LeaveRequest request) {
        int year = request.getStartDate().getYear();
        return leaveBalanceRepository.findByEmployeeIdAndYearAndType(
                tenantId, request.getEmployeeId(), year, request.getLeaveType())
            .map(LeaveBalance::getAvailableDays)
            .orElse(BigDecimal.ZERO);
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
