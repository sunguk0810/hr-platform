package com.hrsaas.attendance.service;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Provides a list of Korean public holidays for a given year.
 * Includes fixed-date holidays (양력), lunar holidays (설날/추석/부처님 오신 날),
 * and substitute holiday (대체공휴일) calculation.
 *
 * <p>Lunar holidays are hardcoded for 2025-2030 since lunar-to-solar conversion
 * requires a separate library or API.</p>
 */
public class KoreanHolidayProvider {

    @Getter
    @AllArgsConstructor
    public static class HolidayInfo {
        private final LocalDate date;
        private final String name;
        private final String nameEn;
        private final boolean isNational; // true=국경일, false=공휴일
    }

    /**
     * Returns the list of Korean public holidays for a given year.
     * Includes substitute holiday calculation for weekends.
     *
     * @param year the year to generate holidays for (2025-2030 supported for lunar holidays)
     * @return list of holiday information including substitute holidays
     */
    public static List<HolidayInfo> getHolidays(int year) {
        List<HolidayInfo> holidays = new ArrayList<>();

        // Fixed-date holidays (양력)
        holidays.add(new HolidayInfo(LocalDate.of(year, 1, 1), "신정", "New Year's Day", false));
        holidays.add(new HolidayInfo(LocalDate.of(year, 3, 1), "삼일절", "Independence Movement Day", true));
        holidays.add(new HolidayInfo(LocalDate.of(year, 5, 5), "어린이날", "Children's Day", false));
        holidays.add(new HolidayInfo(LocalDate.of(year, 6, 6), "현충일", "Memorial Day", false));
        holidays.add(new HolidayInfo(LocalDate.of(year, 8, 15), "광복절", "Liberation Day", true));
        holidays.add(new HolidayInfo(LocalDate.of(year, 10, 3), "개천절", "National Foundation Day", true));
        holidays.add(new HolidayInfo(LocalDate.of(year, 10, 9), "한글날", "Hangul Day", true));
        holidays.add(new HolidayInfo(LocalDate.of(year, 12, 25), "크리스마스", "Christmas Day", false));

        // Lunar holidays - hardcoded for 2025-2030 (solar dates)
        addLunarHolidays(holidays, year);

        // Buddha's Birthday - hardcoded for 2025-2030
        addBuddhasBirthday(holidays, year);

        // Calculate substitute holidays (대체공휴일)
        List<HolidayInfo> substituteHolidays = calculateSubstituteHolidays(holidays);
        holidays.addAll(substituteHolidays);

        return holidays;
    }

    private static void addLunarHolidays(List<HolidayInfo> holidays, int year) {
        // Seollal (설날) - Lunar New Year: day before, day of, day after
        // Chuseok (추석) - Mid-Autumn: day before, day of, day after
        switch (year) {
            case 2025 -> {
                // Seollal: Jan 29 (lunar 1/1 = Jan 29)
                holidays.add(new HolidayInfo(LocalDate.of(2025, 1, 28), "설날 전날", "Lunar New Year's Eve", false));
                holidays.add(new HolidayInfo(LocalDate.of(2025, 1, 29), "설날", "Lunar New Year", false));
                holidays.add(new HolidayInfo(LocalDate.of(2025, 1, 30), "설날 다음날", "Day after Lunar New Year", false));
                // Chuseok: Oct 6
                holidays.add(new HolidayInfo(LocalDate.of(2025, 10, 5), "추석 전날", "Day before Chuseok", false));
                holidays.add(new HolidayInfo(LocalDate.of(2025, 10, 6), "추석", "Chuseok", false));
                holidays.add(new HolidayInfo(LocalDate.of(2025, 10, 7), "추석 다음날", "Day after Chuseok", false));
            }
            case 2026 -> {
                // Seollal: Feb 17
                holidays.add(new HolidayInfo(LocalDate.of(2026, 2, 16), "설날 전날", "Lunar New Year's Eve", false));
                holidays.add(new HolidayInfo(LocalDate.of(2026, 2, 17), "설날", "Lunar New Year", false));
                holidays.add(new HolidayInfo(LocalDate.of(2026, 2, 18), "설날 다음날", "Day after Lunar New Year", false));
                // Chuseok: Sep 25
                holidays.add(new HolidayInfo(LocalDate.of(2026, 9, 24), "추석 전날", "Day before Chuseok", false));
                holidays.add(new HolidayInfo(LocalDate.of(2026, 9, 25), "추석", "Chuseok", false));
                holidays.add(new HolidayInfo(LocalDate.of(2026, 9, 26), "추석 다음날", "Day after Chuseok", false));
            }
            case 2027 -> {
                // Seollal: Feb 6
                holidays.add(new HolidayInfo(LocalDate.of(2027, 2, 5), "설날 전날", "Lunar New Year's Eve", false));
                holidays.add(new HolidayInfo(LocalDate.of(2027, 2, 6), "설날", "Lunar New Year", false));
                holidays.add(new HolidayInfo(LocalDate.of(2027, 2, 7), "설날 다음날", "Day after Lunar New Year", false));
                // Chuseok: Sep 15
                holidays.add(new HolidayInfo(LocalDate.of(2027, 9, 14), "추석 전날", "Day before Chuseok", false));
                holidays.add(new HolidayInfo(LocalDate.of(2027, 9, 15), "추석", "Chuseok", false));
                holidays.add(new HolidayInfo(LocalDate.of(2027, 9, 16), "추석 다음날", "Day after Chuseok", false));
            }
            case 2028 -> {
                // Seollal: Jan 26
                holidays.add(new HolidayInfo(LocalDate.of(2028, 1, 25), "설날 전날", "Lunar New Year's Eve", false));
                holidays.add(new HolidayInfo(LocalDate.of(2028, 1, 26), "설날", "Lunar New Year", false));
                holidays.add(new HolidayInfo(LocalDate.of(2028, 1, 27), "설날 다음날", "Day after Lunar New Year", false));
                // Chuseok: Oct 3
                holidays.add(new HolidayInfo(LocalDate.of(2028, 10, 2), "추석 전날", "Day before Chuseok", false));
                holidays.add(new HolidayInfo(LocalDate.of(2028, 10, 3), "추석", "Chuseok", false));
                holidays.add(new HolidayInfo(LocalDate.of(2028, 10, 4), "추석 다음날", "Day after Chuseok", false));
            }
            case 2029 -> {
                // Seollal: Feb 13
                holidays.add(new HolidayInfo(LocalDate.of(2029, 2, 12), "설날 전날", "Lunar New Year's Eve", false));
                holidays.add(new HolidayInfo(LocalDate.of(2029, 2, 13), "설날", "Lunar New Year", false));
                holidays.add(new HolidayInfo(LocalDate.of(2029, 2, 14), "설날 다음날", "Day after Lunar New Year", false));
                // Chuseok: Sep 22
                holidays.add(new HolidayInfo(LocalDate.of(2029, 9, 21), "추석 전날", "Day before Chuseok", false));
                holidays.add(new HolidayInfo(LocalDate.of(2029, 9, 22), "추석", "Chuseok", false));
                holidays.add(new HolidayInfo(LocalDate.of(2029, 9, 23), "추석 다음날", "Day after Chuseok", false));
            }
            case 2030 -> {
                // Seollal: Feb 3
                holidays.add(new HolidayInfo(LocalDate.of(2030, 2, 2), "설날 전날", "Lunar New Year's Eve", false));
                holidays.add(new HolidayInfo(LocalDate.of(2030, 2, 3), "설날", "Lunar New Year", false));
                holidays.add(new HolidayInfo(LocalDate.of(2030, 2, 4), "설날 다음날", "Day after Lunar New Year", false));
                // Chuseok: Sep 12
                holidays.add(new HolidayInfo(LocalDate.of(2030, 9, 11), "추석 전날", "Day before Chuseok", false));
                holidays.add(new HolidayInfo(LocalDate.of(2030, 9, 12), "추석", "Chuseok", false));
                holidays.add(new HolidayInfo(LocalDate.of(2030, 9, 13), "추석 다음날", "Day after Chuseok", false));
            }
            default -> { /* No lunar holiday data available for this year */ }
        }
    }

    private static void addBuddhasBirthday(List<HolidayInfo> holidays, int year) {
        // Buddha's Birthday (석가탄신일/부처님 오신 날) - Lunar April 8
        LocalDate buddhasBirthday = switch (year) {
            case 2025 -> LocalDate.of(2025, 5, 5); // same as Children's Day
            case 2026 -> LocalDate.of(2026, 5, 24);
            case 2027 -> LocalDate.of(2027, 5, 13);
            case 2028 -> LocalDate.of(2028, 5, 2);
            case 2029 -> LocalDate.of(2029, 5, 20);
            case 2030 -> LocalDate.of(2030, 5, 9);
            default -> null;
        };

        if (buddhasBirthday != null) {
            holidays.add(new HolidayInfo(buddhasBirthday, "부처님 오신 날", "Buddha's Birthday", false));
        }
    }

    /**
     * Calculate substitute holidays (대체공휴일).
     * If a public holiday falls on a weekend, the following Monday (or next available weekday)
     * becomes a substitute holiday. Since 2023, this applies to all public holidays in Korea.
     *
     * @param holidays the list of original holidays to check for weekend collisions
     * @return list of substitute holidays generated
     */
    private static List<HolidayInfo> calculateSubstituteHolidays(List<HolidayInfo> holidays) {
        List<HolidayInfo> substitutes = new ArrayList<>();
        List<LocalDate> existingDates = holidays.stream()
            .map(HolidayInfo::getDate)
            .toList();

        for (HolidayInfo holiday : holidays) {
            DayOfWeek dow = holiday.getDate().getDayOfWeek();
            if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
                // Find the next available weekday
                LocalDate substituteDate = holiday.getDate();
                do {
                    substituteDate = substituteDate.plusDays(1);
                } while (substituteDate.getDayOfWeek() == DayOfWeek.SATURDAY
                    || substituteDate.getDayOfWeek() == DayOfWeek.SUNDAY
                    || existingDates.contains(substituteDate)
                    || containsDate(substitutes, substituteDate));

                substitutes.add(new HolidayInfo(
                    substituteDate,
                    holiday.getName() + " 대체공휴일",
                    "Substitute Holiday for " + holiday.getNameEn(),
                    false
                ));
            }
        }

        return substitutes;
    }

    private static boolean containsDate(List<HolidayInfo> holidays, LocalDate date) {
        for (HolidayInfo h : holidays) {
            if (h.getDate().equals(date)) {
                return true;
            }
        }
        return false;
    }
}
