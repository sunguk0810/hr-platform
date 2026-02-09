package com.hrsaas.attendance.service;

import com.hrsaas.attendance.domain.dto.request.UpdateAttendanceRecordRequest;
import com.hrsaas.attendance.domain.dto.response.AttendanceRecordResponse;
import com.hrsaas.attendance.domain.entity.AttendanceModificationLog;
import com.hrsaas.attendance.domain.entity.AttendanceRecord;
import com.hrsaas.attendance.domain.entity.AttendanceStatus;
import com.hrsaas.attendance.repository.AttendanceModificationLogRepository;
import com.hrsaas.attendance.repository.AttendanceRecordRepository;
import com.hrsaas.attendance.repository.OvertimeRequestRepository;
import com.hrsaas.attendance.service.impl.AttendanceServiceImpl;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AttendanceServiceImpl Tests")
class AttendanceServiceImplTest {

    @Mock
    private AttendanceRecordRepository attendanceRecordRepository;

    @Mock
    private OvertimeRequestRepository overtimeRequestRepository;

    @Mock
    private AttendanceModificationLogRepository modificationLogRepository;

    @InjectMocks
    private AttendanceServiceImpl attendanceService;

    @Captor
    private ArgumentCaptor<List<AttendanceModificationLog>> logsCaptor;

    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final UUID ADMIN_ID = UUID.randomUUID();
    private static final UUID EMPLOYEE_ID = UUID.randomUUID();
    private static final UUID RECORD_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private AttendanceRecord createRecord(LocalTime checkIn, LocalTime checkOut, AttendanceStatus status) {
        return AttendanceRecord.builder()
                .id(RECORD_ID)
                .tenantId(TENANT_ID)
                .employeeId(EMPLOYEE_ID)
                .workDate(LocalDate.now())
                .checkInTime(checkIn)
                .checkOutTime(checkOut)
                .status(status)
                .lateMinutes(0)
                .earlyLeaveMinutes(0)
                .overtimeMinutes(0)
                .workHours(8)
                .build();
    }

    @Test
    @DisplayName("updateRecord: changes checkInTime creates audit log")
    void updateRecord_changesCheckInTime_createsAuditLog() {
        // given
        AttendanceRecord record = createRecord(LocalTime.of(9, 0), LocalTime.of(18, 0), AttendanceStatus.NORMAL);
        when(attendanceRecordRepository.findById(RECORD_ID)).thenReturn(Optional.of(record));
        when(attendanceRecordRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateAttendanceRecordRequest request = UpdateAttendanceRecordRequest.builder()
                .checkInTime(LocalTime.of(8, 30))
                .remarks("출근 시간 정정")
                .build();

        // when
        AttendanceRecordResponse response = attendanceService.updateRecord(RECORD_ID, request, ADMIN_ID, "관리자");

        // then
        verify(modificationLogRepository).saveAll(logsCaptor.capture());
        List<AttendanceModificationLog> logs = logsCaptor.getValue();
        assertThat(logs).hasSize(1);
        assertThat(logs.get(0).getFieldName()).isEqualTo("checkInTime");
        assertThat(logs.get(0).getOldValue()).isEqualTo("09:00");
        assertThat(logs.get(0).getNewValue()).isEqualTo("08:30");
        assertThat(response.checkInTime()).isEqualTo(LocalTime.of(8, 30));
    }

    @Test
    @DisplayName("updateRecord: no changes creates no audit log")
    void updateRecord_noChanges_noAuditLog() {
        // given
        AttendanceRecord record = createRecord(LocalTime.of(9, 0), LocalTime.of(18, 0), AttendanceStatus.NORMAL);
        when(attendanceRecordRepository.findById(RECORD_ID)).thenReturn(Optional.of(record));

        UpdateAttendanceRecordRequest request = UpdateAttendanceRecordRequest.builder()
                .checkInTime(LocalTime.of(9, 0)) // same value
                .remarks("변경 없음")
                .build();

        // when
        AttendanceRecordResponse response = attendanceService.updateRecord(RECORD_ID, request, ADMIN_ID, "관리자");

        // then
        verify(modificationLogRepository, never()).saveAll(any());
        verify(attendanceRecordRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateRecord: not found throws exception")
    void updateRecord_notFound_throwsException() {
        // given
        when(attendanceRecordRepository.findById(RECORD_ID)).thenReturn(Optional.empty());

        UpdateAttendanceRecordRequest request = UpdateAttendanceRecordRequest.builder()
                .checkInTime(LocalTime.of(8, 30))
                .remarks("테스트")
                .build();

        // when & then
        assertThatThrownBy(() -> attendanceService.updateRecord(RECORD_ID, request, ADMIN_ID, "관리자"))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("updateRecord: recalculates late minutes when checkInTime changes")
    void updateRecord_recalculatesLateMinutes() {
        // given - originally on time
        AttendanceRecord record = createRecord(LocalTime.of(9, 0), LocalTime.of(18, 0), AttendanceStatus.NORMAL);
        when(attendanceRecordRepository.findById(RECORD_ID)).thenReturn(Optional.of(record));
        when(attendanceRecordRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // change to late arrival
        UpdateAttendanceRecordRequest request = UpdateAttendanceRecordRequest.builder()
                .checkInTime(LocalTime.of(9, 30))
                .remarks("실제 출근 시간 반영")
                .build();

        // when
        AttendanceRecordResponse response = attendanceService.updateRecord(RECORD_ID, request, ADMIN_ID, "관리자");

        // then
        assertThat(response.lateMinutes()).isEqualTo(30);
    }

    @Test
    @DisplayName("updateRecord: recalculates work hours when checkOutTime changes")
    void updateRecord_recalculatesWorkHours() {
        // given
        AttendanceRecord record = createRecord(LocalTime.of(9, 0), LocalTime.of(18, 0), AttendanceStatus.NORMAL);
        when(attendanceRecordRepository.findById(RECORD_ID)).thenReturn(Optional.of(record));
        when(attendanceRecordRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // change checkout to 20:00 (2 hours overtime)
        UpdateAttendanceRecordRequest request = UpdateAttendanceRecordRequest.builder()
                .checkOutTime(LocalTime.of(20, 0))
                .remarks("실제 퇴근 시간 반영")
                .build();

        // when
        AttendanceRecordResponse response = attendanceService.updateRecord(RECORD_ID, request, ADMIN_ID, "관리자");

        // then - 9:00 to 20:00 = 11 hours - 1 hour lunch = 10 hours
        assertThat(response.workHours()).isEqualTo(10);
        assertThat(response.overtimeMinutes()).isEqualTo(120);
    }

    @Test
    @DisplayName("updateRecord: multiple field changes creates multiple audit logs")
    void updateRecord_multipleChanges_createsMultipleAuditLogs() {
        // given
        AttendanceRecord record = createRecord(LocalTime.of(9, 0), LocalTime.of(18, 0), AttendanceStatus.NORMAL);
        when(attendanceRecordRepository.findById(RECORD_ID)).thenReturn(Optional.of(record));
        when(attendanceRecordRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateAttendanceRecordRequest request = UpdateAttendanceRecordRequest.builder()
                .checkInTime(LocalTime.of(8, 30))
                .checkOutTime(LocalTime.of(19, 0))
                .status(AttendanceStatus.BUSINESS_TRIP)
                .remarks("출장 처리")
                .build();

        // when
        attendanceService.updateRecord(RECORD_ID, request, ADMIN_ID, "관리자");

        // then
        verify(modificationLogRepository).saveAll(logsCaptor.capture());
        List<AttendanceModificationLog> logs = logsCaptor.getValue();
        assertThat(logs).hasSize(3);
    }
}
