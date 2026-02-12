package com.hrsaas.attendance.domain.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("AttendanceRecord Tests")
class AttendanceRecordTest {

    @Test
    @DisplayName("checkIn: calculates late minutes based on standard start time")
    void checkIn_calculatesLateMinutes() {
        // given
        LocalTime standardStartTime = LocalTime.of(9, 0);
        AttendanceRecord record = AttendanceRecord.builder()
                .employeeId(UUID.randomUUID())
                .build();

        // when - check in at 9:30
        record.checkIn(LocalTime.of(9, 30), "Office", standardStartTime);

        // then
        assertThat(record.getLateMinutes()).isEqualTo(30);
        assertThat(record.getStatus()).isEqualTo(AttendanceStatus.LATE);
    }

    @Test
    @DisplayName("checkIn: on time check in sets late minutes to 0")
    void checkIn_onTime() {
        // given
        LocalTime standardStartTime = LocalTime.of(9, 0);
        AttendanceRecord record = AttendanceRecord.builder()
                .employeeId(UUID.randomUUID())
                .build();

        // when - check in at 8:55
        record.checkIn(LocalTime.of(8, 55), "Office", standardStartTime);

        // then
        assertThat(record.getLateMinutes()).isEqualTo(0);
        assertThat(record.getStatus()).isEqualTo(AttendanceStatus.NORMAL); // Default is NORMAL
    }

    @Test
    @DisplayName("checkOut: calculates early leave minutes based on standard end time")
    void checkOut_calculatesEarlyLeaveMinutes() {
        // given
        LocalTime standardEndTime = LocalTime.of(18, 0);
        AttendanceRecord record = AttendanceRecord.builder()
                .employeeId(UUID.randomUUID())
                .checkInTime(LocalTime.of(9, 0))
                .build();

        // when - check out at 17:30
        record.checkOut(LocalTime.of(17, 30), "Office", standardEndTime);

        // then
        assertThat(record.getEarlyLeaveMinutes()).isEqualTo(30);
        assertThat(record.getStatus()).isEqualTo(AttendanceStatus.EARLY_LEAVE);
    }

    @Test
    @DisplayName("checkOut: on time check out sets early leave minutes to 0")
    void checkOut_onTime() {
        // given
        LocalTime standardEndTime = LocalTime.of(18, 0);
        AttendanceRecord record = AttendanceRecord.builder()
                .employeeId(UUID.randomUUID())
                .checkInTime(LocalTime.of(9, 0))
                .build();

        // when - check out at 18:05
        record.checkOut(LocalTime.of(18, 5), "Office", standardEndTime);

        // then
        assertThat(record.getEarlyLeaveMinutes()).isEqualTo(0);
    }

    @Test
    @DisplayName("checkOut: calculates overtime minutes based on standard end time")
    void checkOut_calculatesOvertimeMinutes() {
        // given
        LocalTime standardEndTime = LocalTime.of(18, 0);
        AttendanceRecord record = AttendanceRecord.builder()
                .employeeId(UUID.randomUUID())
                .checkInTime(LocalTime.of(9, 0))
                .build();

        // when - check out at 19:30
        record.checkOut(LocalTime.of(19, 30), "Office", standardEndTime);

        // then
        assertThat(record.getOvertimeMinutes()).isEqualTo(90);
    }

    @Test
    @DisplayName("checkOut: calculates work hours correctly")
    void checkOut_calculatesWorkHours() {
        // given
        LocalTime standardEndTime = LocalTime.of(18, 0);
        AttendanceRecord record = AttendanceRecord.builder()
                .employeeId(UUID.randomUUID())
                .checkInTime(LocalTime.of(9, 0))
                .build();

        // when - check out at 18:00
        record.checkOut(LocalTime.of(18, 0), "Office", standardEndTime);

        // then - 9 hours total - 1 hour lunch = 8 hours
        assertThat(record.getWorkHours()).isEqualTo(8);
    }
}
