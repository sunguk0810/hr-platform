package com.hrsaas.common.core.util;

import java.util.UUID;
import java.util.regex.Pattern;

/**
 * String utility methods.
 */
public final class StringUtils {

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$"
    );

    private static final Pattern PHONE_PATTERN = Pattern.compile(
        "^\\d{2,3}-\\d{3,4}-\\d{4}$"
    );

    private StringUtils() {
        // Utility class
    }

    public static boolean isBlank(String str) {
        return str == null || str.isBlank();
    }

    public static boolean isNotBlank(String str) {
        return !isBlank(str);
    }

    public static boolean isEmpty(String str) {
        return str == null || str.isEmpty();
    }

    public static boolean isNotEmpty(String str) {
        return !isEmpty(str);
    }

    public static String trim(String str) {
        return str == null ? null : str.trim();
    }

    public static String defaultIfBlank(String str, String defaultStr) {
        return isBlank(str) ? defaultStr : str;
    }

    public static boolean isValidEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email).matches();
    }

    public static boolean isValidPhone(String phone) {
        return phone != null && PHONE_PATTERN.matcher(phone).matches();
    }

    public static String generateUUID() {
        return UUID.randomUUID().toString();
    }

    public static String generateShortUUID() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }

    public static UUID parseUUID(String uuidStr) {
        if (isBlank(uuidStr)) {
            return null;
        }
        try {
            return UUID.fromString(uuidStr);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    public static String maskMiddle(String str, int visibleChars) {
        if (str == null || str.length() <= visibleChars * 2) {
            return str;
        }
        int length = str.length();
        String start = str.substring(0, visibleChars);
        String end = str.substring(length - visibleChars);
        String mask = "*".repeat(length - visibleChars * 2);
        return start + mask + end;
    }

    public static String truncate(String str, int maxLength) {
        if (str == null || str.length() <= maxLength) {
            return str;
        }
        return str.substring(0, maxLength);
    }

    public static String toSnakeCase(String str) {
        if (isBlank(str)) {
            return str;
        }
        return str.replaceAll("([a-z])([A-Z])", "$1_$2").toLowerCase();
    }

    public static String toCamelCase(String str) {
        if (isBlank(str)) {
            return str;
        }
        StringBuilder result = new StringBuilder();
        boolean nextUpper = false;
        for (char c : str.toCharArray()) {
            if (c == '_' || c == '-') {
                nextUpper = true;
            } else {
                result.append(nextUpper ? Character.toUpperCase(c) : Character.toLowerCase(c));
                nextUpper = false;
            }
        }
        return result.toString();
    }
}
