package com.hrsaas.attendance.service.impl;

import com.hrsaas.attendance.domain.dto.request.CheckInRequest;
import com.hrsaas.attendance.domain.dto.request.CheckOutRequest;
import com.hrsaas.attendance.domain.dto.response.AttendanceRecordResponse;
import com.hrsaas.attendance.domain.dto.response.AttendanceSummaryResponse;
import com.hrsaas.attendance.domain.entity.AttendanceRecord;
import com.hrsaas.attendance.domain.entity.AttendanceStatus;
import com.hrsaas.attendance.repository.AttendanceRecordRepository;
import com.hrsaas.attendance.service.AttendanceService;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRecordRepository attendanceRecordRepository;

    @Override
    @Transactional
    public AttendanceRecordResponse checkIn(CheckInRequest request, UUID employeeId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        // 이미 오늘 출근 기록이 있는지 확인
        attendanceRecordRepository.findByEmployeeIdAndWorkDate(tenantId, employeeId, today)
            .ifPresent(record -> {
                if (record.getCheckInTime() != null) {
                    throw new BusinessException("ATT_001", "이미 오늘 출근 처리가 되어 있습니다", HttpStatus.CONFLICT);
                }
            });

        // 새 출근 기록 생성 또는 기존 기록에 출근 시간 기록
        AttendanceRecord record = attendanceRecordRepository
            .findByEmployeeIdAndWorkDate(tenantId, employeeId, today)
            .orElseGet(() -> AttendanceRecord.builder()
                .employeeId(employeeId)
                .workDate(today)
                .build());

        record.checkIn(now, request.location());
        if (request.note() != null && !request.note().isBlank()) {
            record.setNote(request.note());
        }

        AttendanceRecord saved = attendanceRecordRepository.save(record);
        log.info("Check-in recorded: employeeId={}, time={}, location={}", employeeId, now, request.location());

        return AttendanceRecordResponse.from(saved);
    }

    @Override
    @Transactional
    public AttendanceRecordResponse checkOut(CheckOutRequest request, UUID employeeId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        AttendanceRecord record = attendanceRecordRepository
            .findByEmployeeIdAndWorkDate(tenantId, employeeId, today)
            .orElseThrow(() -> new NotFoundException("ATT_002", "오늘 출근 기록이 없습니다. 먼저 출근 처리를 해주세요."));

        if (record.getCheckInTime() == null) {
            throw new BusinessException("ATT_003", "출근 처리 없이 퇴근할 수 없습니다", HttpStatus.BAD_REQUEST);
        }

        if (record.getCheckOutTime() != null) {
            throw new BusinessException("ATT_004", "이미 퇴근 처리가 되어 있습니다", HttpStatus.CONFLICT);
        }

        record.checkOut(now, request.location());
        if (request.note() != null && !request.note().isBlank()) {
            String existingNote = record.getNote();
            String newNote = existingNote != null ? existingNote + " | " + request.note() : request.note();
            record.setNote(newNote);
        }

        AttendanceRecord saved = attendanceRecordRepository.save(record);
        log.info("Check-out recorded: employeeId={}, time={}, workHours={}", employeeId, now, saved.getWorkHours());

        return AttendanceRecordResponse.from(saved);
    }

    @Override
    public AttendanceRecordResponse getToday(UUID employeeId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        LocalDate today = LocalDate.now();

        AttendanceRecord record = attendanceRecordRepository
            .findByEmployeeIdAndWorkDate(tenantId, employeeId, today)
            .orElse(null);

        if (record == null) {
            // 오늘 기록이 없으면 빈 응답 반환 (출퇴근 전 상태)
            return new AttendanceRecordResponse(
                null, employeeId, today, null, null,
                AttendanceStatus.NORMAL, 0, 0, 0, 0, null, null, null
            );
        }

        return AttendanceRecordResponse.from(record);
    }

    @Override
    public List<AttendanceRecordResponse> getMyAttendances(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        UUID tenantId = TenantContext.getCurrentTenant();

        if (startDate.isAfter(endDate)) {
            throw new BusinessException("ATT_005", "시작일이 종료일보다 늦을 수 없습니다", HttpStatus.BAD_REQUEST);
        }

        List<AttendanceRecord> records = attendanceRecordRepository
            .findByEmployeeIdAndDateRange(tenantId, employeeId, startDate, endDate);

        return records.stream()
            .map(AttendanceRecordResponse::from)
            .toList();
    }

    @Override
    public AttendanceSummaryResponse getMonthlySummary(UUID employeeId, int year, int month) {
        UUID tenantId = TenantContext.getCurrentTenant();

        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        List<AttendanceRecord> records = attendanceRecordRepository
            .findByEmployeeIdAndDateRange(tenantId, employeeId, startDate, endDate);

        int presentDays = (int) records.stream()
            .filter(r -> r.getCheckInTime() != null)
            .count();

        int lateDays = (int) records.stream()
            .filter(r -> r.getStatus() == AttendanceStatus.LATE)
            .count();

        int earlyLeaveDays = (int) records.stream()
            .filter(r -> r.getStatus() == AttendanceStatus.EARLY_LEAVE)
            .count();

        int totalOvertimeMinutes = records.stream()
            .mapToInt(r -> r.getOvertimeMinutes() != null ? r.getOvertimeMinutes() : 0)
            .sum();

        int totalWorkHours = records.stream()
            .mapToInt(r -> r.getWorkHours() != null ? r.getWorkHours() : 0)
            .sum();

        // 해당 월의 근무일수 계산 (주말 제외, 공휴일은 별도 처리 필요)
        int totalWorkDays = calculateWorkDays(yearMonth);

        return AttendanceSummaryResponse.of(
            year, month, totalWorkDays, presentDays,
            lateDays, earlyLeaveDays, totalOvertimeMinutes, totalWorkHours
        );
    }

    @Override
    public AttendanceRecordResponse getById(UUID id) {
        AttendanceRecord record = attendanceRecordRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("ATT_006", "근태 기록을 찾을 수 없습니다: " + id));

        return AttendanceRecordResponse.from(record);
    }

    private int calculateWorkDays(YearMonth yearMonth) {
        int workDays = 0;
        LocalDate date = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        while (!date.isAfter(endDate)) {
            java.time.DayOfWeek dayOfWeek = date.getDayOfWeek();
            if (dayOfWeek != java.time.DayOfWeek.SATURDAY && dayOfWeek != java.time.DayOfWeek.SUNDAY) {
                workDays++;
            }
            date = date.plusDays(1);
        }

        return workDays;
    }
}
