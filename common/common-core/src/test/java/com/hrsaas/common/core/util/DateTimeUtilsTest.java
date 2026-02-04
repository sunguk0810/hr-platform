package com.hrsaas.common.core.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("DateTimeUtils Tests")
class DateTimeUtilsTest {

    @Nested
    @DisplayName("Parse Methods")
    class ParseMethods {

        @Test
        @DisplayName("parseDate: 유효한 날짜 문자열 파싱")
        void parseDate_validString_returnLocalDate() {
            LocalDate result = DateTimeUtils.parseDate("2025-01-15");
            assertThat(result).isEqualTo(LocalDate.of(2025, 1, 15));
        }

        @Test
        @DisplayName("parseDate: null 입력시 null 반환")
        void parseDate_null_returnNull() {
            LocalDate result = DateTimeUtils.parseDate(null);
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("parseDate: 빈 문자열 입력시 null 반환")
        void parseDate_emptyString_returnNull() {
            LocalDate result = DateTimeUtils.parseDate("");
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("parseDate: 공백 문자열 입력시 null 반환")
        void parseDate_blankString_returnNull() {
            LocalDate result = DateTimeUtils.parseDate("   ");
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("parseDateTime: 유효한 날짜시간 문자열 파싱")
        void parseDateTime_validString_returnLocalDateTime() {
            LocalDateTime result = DateTimeUtils.parseDateTime("2025-01-15 14:30:00");
            assertThat(result).isEqualTo(LocalDateTime.of(2025, 1, 15, 14, 30, 0));
        }

        @Test
        @DisplayName("parseDateTime: null 입력시 null 반환")
        void parseDateTime_null_returnNull() {
            LocalDateTime result = DateTimeUtils.parseDateTime(null);
            assertThat(result).isNull();
        }
    }

    @Nested
    @DisplayName("Format Methods")
    class FormatMethods {

        @Test
        @DisplayName("formatDate: LocalDate를 문자열로 포맷")
        void formatDate_validDate_returnFormattedString() {
            String result = DateTimeUtils.formatDate(LocalDate.of(2025, 3, 20));
            assertThat(result).isEqualTo("2025-03-20");
        }

        @Test
        @DisplayName("formatDate: null 입력시 null 반환")
        void formatDate_null_returnNull() {
            String result = DateTimeUtils.formatDate(null);
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("formatDateTime: LocalDateTime을 문자열로 포맷")
        void formatDateTime_validDateTime_returnFormattedString() {
            String result = DateTimeUtils.formatDateTime(LocalDateTime.of(2025, 3, 20, 9, 15, 30));
            assertThat(result).isEqualTo("2025-03-20 09:15:30");
        }

        @Test
        @DisplayName("formatDateTime: null 입력시 null 반환")
        void formatDateTime_null_returnNull() {
            String result = DateTimeUtils.formatDateTime(null);
            assertThat(result).isNull();
        }
    }

    @Nested
    @DisplayName("Date Calculation Methods")
    class DateCalculationMethods {

        @Test
        @DisplayName("daysBetween: 두 날짜 사이 일수 계산")
        void daysBetween_validDates_returnDayCount() {
            LocalDate start = LocalDate.of(2025, 1, 1);
            LocalDate end = LocalDate.of(2025, 1, 10);
            long result = DateTimeUtils.daysBetween(start, end);
            assertThat(result).isEqualTo(9);
        }

        @Test
        @DisplayName("daysBetween: 같은 날짜면 0 반환")
        void daysBetween_sameDates_returnZero() {
            LocalDate date = LocalDate.of(2025, 1, 1);
            long result = DateTimeUtils.daysBetween(date, date);
            assertThat(result).isEqualTo(0);
        }

        @Test
        @DisplayName("isWeekend: 토요일이면 true")
        void isWeekend_saturday_returnTrue() {
            LocalDate saturday = LocalDate.of(2025, 1, 4); // Saturday
            assertThat(DateTimeUtils.isWeekend(saturday)).isTrue();
            assertThat(saturday.getDayOfWeek()).isEqualTo(DayOfWeek.SATURDAY);
        }

        @Test
        @DisplayName("isWeekend: 일요일이면 true")
        void isWeekend_sunday_returnTrue() {
            LocalDate sunday = LocalDate.of(2025, 1, 5); // Sunday
            assertThat(DateTimeUtils.isWeekend(sunday)).isTrue();
            assertThat(sunday.getDayOfWeek()).isEqualTo(DayOfWeek.SUNDAY);
        }

        @Test
        @DisplayName("isWeekend: 평일이면 false")
        void isWeekend_weekday_returnFalse() {
            LocalDate monday = LocalDate.of(2025, 1, 6); // Monday
            assertThat(DateTimeUtils.isWeekend(monday)).isFalse();
        }

        @Test
        @DisplayName("countWorkingDays: 평일만 카운트")
        void countWorkingDays_validRange_countOnlyWeekdays() {
            // 2025-01-06 (Mon) to 2025-01-10 (Fri) = 5 working days
            LocalDate start = LocalDate.of(2025, 1, 6);
            LocalDate end = LocalDate.of(2025, 1, 10);
            long result = DateTimeUtils.countWorkingDays(start, end);
            assertThat(result).isEqualTo(5);
        }

        @Test
        @DisplayName("countWorkingDays: 주말 포함 기간")
        void countWorkingDays_includesWeekend_excludesWeekendDays() {
            // 2025-01-03 (Fri) to 2025-01-07 (Tue) includes Sat, Sun
            // Fri(1) + Mon(1) + Tue(1) = 3 working days
            LocalDate start = LocalDate.of(2025, 1, 3);
            LocalDate end = LocalDate.of(2025, 1, 7);
            long result = DateTimeUtils.countWorkingDays(start, end);
            assertThat(result).isEqualTo(3);
        }
    }

    @Nested
    @DisplayName("Month/Year Boundary Methods")
    class MonthYearBoundaryMethods {

        @Test
        @DisplayName("startOfMonth: 해당 월의 첫째 날 반환")
        void startOfMonth_validDate_returnFirstDayOfMonth() {
            LocalDate result = DateTimeUtils.startOfMonth(LocalDate.of(2025, 3, 15));
            assertThat(result).isEqualTo(LocalDate.of(2025, 3, 1));
        }

        @Test
        @DisplayName("endOfMonth: 해당 월의 마지막 날 반환")
        void endOfMonth_validDate_returnLastDayOfMonth() {
            LocalDate result = DateTimeUtils.endOfMonth(LocalDate.of(2025, 3, 15));
            assertThat(result).isEqualTo(LocalDate.of(2025, 3, 31));
        }

        @Test
        @DisplayName("endOfMonth: 2월(윤년 아님) 마지막 날")
        void endOfMonth_february_returnLastDay() {
            LocalDate result = DateTimeUtils.endOfMonth(LocalDate.of(2025, 2, 10));
            assertThat(result).isEqualTo(LocalDate.of(2025, 2, 28));
        }

        @Test
        @DisplayName("endOfMonth: 2월(윤년) 마지막 날")
        void endOfMonth_februaryLeapYear_returnLastDay() {
            LocalDate result = DateTimeUtils.endOfMonth(LocalDate.of(2024, 2, 10));
            assertThat(result).isEqualTo(LocalDate.of(2024, 2, 29));
        }

        @Test
        @DisplayName("startOfYear: 해당 연도의 첫째 날 반환")
        void startOfYear_validDate_returnFirstDayOfYear() {
            LocalDate result = DateTimeUtils.startOfYear(LocalDate.of(2025, 7, 15));
            assertThat(result).isEqualTo(LocalDate.of(2025, 1, 1));
        }

        @Test
        @DisplayName("endOfYear: 해당 연도의 마지막 날 반환")
        void endOfYear_validDate_returnLastDayOfYear() {
            LocalDate result = DateTimeUtils.endOfYear(LocalDate.of(2025, 7, 15));
            assertThat(result).isEqualTo(LocalDate.of(2025, 12, 31));
        }
    }

    @Nested
    @DisplayName("Instant Conversion Methods")
    class InstantConversionMethods {

        @Test
        @DisplayName("toLocalDateTime: Instant를 LocalDateTime으로 변환")
        void toLocalDateTime_validInstant_returnLocalDateTime() {
            Instant instant = Instant.parse("2025-01-15T05:30:00Z"); // UTC
            LocalDateTime result = DateTimeUtils.toLocalDateTime(instant);
            // KST = UTC+9, so 05:30 UTC = 14:30 KST
            assertThat(result.getHour()).isEqualTo(14);
            assertThat(result.getMinute()).isEqualTo(30);
        }

        @Test
        @DisplayName("toLocalDateTime: null 입력시 null 반환")
        void toLocalDateTime_null_returnNull() {
            LocalDateTime result = DateTimeUtils.toLocalDateTime(null);
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("toInstant: LocalDateTime을 Instant로 변환")
        void toInstant_validLocalDateTime_returnInstant() {
            LocalDateTime dateTime = LocalDateTime.of(2025, 1, 15, 14, 30, 0);
            Instant result = DateTimeUtils.toInstant(dateTime);
            // KST 14:30 = UTC 05:30
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("toInstant: null 입력시 null 반환")
        void toInstant_null_returnNull() {
            Instant result = DateTimeUtils.toInstant(null);
            assertThat(result).isNull();
        }
    }

    @Nested
    @DisplayName("Current Time Methods")
    class CurrentTimeMethods {

        @Test
        @DisplayName("today: 오늘 날짜 반환 (KST)")
        void today_returnsTodayInKst() {
            LocalDate result = DateTimeUtils.today();
            assertThat(result).isNotNull();
            assertThat(result).isBeforeOrEqualTo(LocalDate.now().plusDays(1));
        }

        @Test
        @DisplayName("now: 현재 시간 반환 (KST)")
        void now_returnsCurrentTimeInKst() {
            LocalDateTime result = DateTimeUtils.now();
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("nowInstant: 현재 Instant 반환")
        void nowInstant_returnsCurrentInstant() {
            Instant result = DateTimeUtils.nowInstant();
            assertThat(result).isNotNull();
            assertThat(result).isBeforeOrEqualTo(Instant.now().plusSeconds(1));
        }
    }
}
