package com.hrsaas.attendance.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("KoreanHolidayProvider Tests")
class KoreanHolidayProviderTest {

    @Test
    @DisplayName("getHolidays_2026_returnsCorrectDates")
    void getHolidays_2026_returnsCorrectDates() {
        // when
        List<KoreanHolidayProvider.HolidayInfo> holidays = KoreanHolidayProvider.getHolidays(2026);

        // then
        assertThat(holidays).isNotEmpty();

        // Fixed holidays
        assertThat(holidays).anyMatch(h -> h.getDate().equals(LocalDate.of(2026, 1, 1))
            && h.getName().equals("신정"));
        assertThat(holidays).anyMatch(h -> h.getDate().equals(LocalDate.of(2026, 3, 1))
            && h.getName().equals("삼일절"));
        assertThat(holidays).anyMatch(h -> h.getDate().equals(LocalDate.of(2026, 8, 15))
            && h.getName().equals("광복절"));

        // Lunar holidays - Seollal 2026: Feb 16-18
        assertThat(holidays).anyMatch(h -> h.getDate().equals(LocalDate.of(2026, 2, 17))
            && h.getName().equals("설날"));

        // Chuseok 2026: Sep 24-26
        assertThat(holidays).anyMatch(h -> h.getDate().equals(LocalDate.of(2026, 9, 25))
            && h.getName().equals("추석"));

        // Buddha's Birthday 2026: May 24
        assertThat(holidays).anyMatch(h -> h.getDate().equals(LocalDate.of(2026, 5, 24))
            && h.getName().equals("부처님 오신 날"));
    }

    @Test
    @DisplayName("getHolidays_substituteHolidaysOnWeekday")
    void getHolidays_substituteHolidays_areOnWeekday() {
        // when
        List<KoreanHolidayProvider.HolidayInfo> holidays = KoreanHolidayProvider.getHolidays(2026);

        // then - all substitute holidays must be on weekdays
        List<KoreanHolidayProvider.HolidayInfo> substitutes = holidays.stream()
            .filter(h -> h.getName().contains("대체공휴일"))
            .toList();

        for (KoreanHolidayProvider.HolidayInfo sub : substitutes) {
            DayOfWeek dow = sub.getDate().getDayOfWeek();
            assertThat(dow).isNotIn(DayOfWeek.SATURDAY, DayOfWeek.SUNDAY);
        }
    }

    @Test
    @DisplayName("getHolidays_unsupportedYear_returnsFixedOnly")
    void getHolidays_unsupportedYear_returnsFixedOnly() {
        // when - year 2050 has no lunar holidays hardcoded
        List<KoreanHolidayProvider.HolidayInfo> holidays = KoreanHolidayProvider.getHolidays(2050);

        // then - still has fixed holidays
        assertThat(holidays).anyMatch(h -> h.getName().equals("신정"));
        assertThat(holidays).anyMatch(h -> h.getName().equals("크리스마스"));
        // No lunar holidays
        assertThat(holidays).noneMatch(h -> h.getName().equals("설날"));
        assertThat(holidays).noneMatch(h -> h.getName().equals("추석"));
    }
}
