package com.hrsaas.common.core.util;

import com.hrsaas.common.core.constant.DateConstants;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

/**
 * Date/Time utility methods.
 */
public final class DateTimeUtils {

    public static final ZoneId KST = DateConstants.KST;
    public static final DateTimeFormatter DATE_FORMAT = DateConstants.DATE_FORMATTER;
    public static final DateTimeFormatter DATETIME_FORMAT = DateConstants.DATETIME_FORMATTER;

    private DateTimeUtils() {
        // Utility class
    }

    public static LocalDate today() {
        return LocalDate.now(KST);
    }

    public static LocalDateTime now() {
        return LocalDateTime.now(KST);
    }

    public static Instant nowInstant() {
        return Instant.now();
    }

    public static LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return null;
        }
        return LocalDate.parse(dateStr, DATE_FORMAT);
    }

    public static LocalDateTime parseDateTime(String dateTimeStr) {
        if (dateTimeStr == null || dateTimeStr.isBlank()) {
            return null;
        }
        return LocalDateTime.parse(dateTimeStr, DATETIME_FORMAT);
    }

    public static String formatDate(LocalDate date) {
        if (date == null) {
            return null;
        }
        return date.format(DATE_FORMAT);
    }

    public static String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.format(DATETIME_FORMAT);
    }

    public static long daysBetween(LocalDate start, LocalDate end) {
        return ChronoUnit.DAYS.between(start, end);
    }

    public static boolean isWeekend(LocalDate date) {
        DayOfWeek dow = date.getDayOfWeek();
        return dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY;
    }

    public static long countWorkingDays(LocalDate start, LocalDate end) {
        return start.datesUntil(end.plusDays(1))
            .filter(date -> !isWeekend(date))
            .count();
    }

    public static LocalDate startOfMonth(LocalDate date) {
        return date.withDayOfMonth(1);
    }

    public static LocalDate endOfMonth(LocalDate date) {
        return date.withDayOfMonth(date.lengthOfMonth());
    }

    public static LocalDate startOfYear(LocalDate date) {
        return date.withDayOfYear(1);
    }

    public static LocalDate endOfYear(LocalDate date) {
        return date.withDayOfYear(date.lengthOfYear());
    }

    public static LocalDateTime toLocalDateTime(Instant instant) {
        if (instant == null) {
            return null;
        }
        return LocalDateTime.ofInstant(instant, KST);
    }

    public static Instant toInstant(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.atZone(KST).toInstant();
    }
}
