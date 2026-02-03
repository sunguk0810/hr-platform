package com.hrsaas.common.core.constant;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Date and time related constants.
 */
public interface DateConstants {

    ZoneId KST = ZoneId.of("Asia/Seoul");
    ZoneId UTC = ZoneId.of("UTC");

    String DATE_PATTERN = "yyyy-MM-dd";
    String DATETIME_PATTERN = "yyyy-MM-dd HH:mm:ss";
    String ISO_DATETIME_PATTERN = "yyyy-MM-dd'T'HH:mm:ss";
    String ISO_DATETIME_WITH_ZONE_PATTERN = "yyyy-MM-dd'T'HH:mm:ssXXX";

    DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern(DATE_PATTERN);
    DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern(DATETIME_PATTERN);
    DateTimeFormatter ISO_DATETIME_FORMATTER = DateTimeFormatter.ofPattern(ISO_DATETIME_PATTERN);
}
