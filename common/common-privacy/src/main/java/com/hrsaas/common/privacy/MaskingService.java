package com.hrsaas.common.privacy;

import org.springframework.stereotype.Service;

/**
 * Service for masking sensitive personal information.
 */
@Service
public class MaskingService {

    /**
     * Mask name: 홍길동 -> 홍*동
     */
    public String maskName(String name) {
        if (name == null || name.length() < 2) {
            return name;
        }
        if (name.length() == 2) {
            return name.charAt(0) + "*";
        }
        return name.charAt(0) + "*".repeat(name.length() - 2) + name.charAt(name.length() - 1);
    }

    /**
     * Mask email: user@example.com -> us***@example.com
     */
    public String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return email;
        }
        int atIndex = email.indexOf('@');
        String localPart = email.substring(0, atIndex);
        String domain = email.substring(atIndex);

        if (localPart.length() <= 2) {
            return localPart + "***" + domain;
        }
        return localPart.substring(0, 2) + "***" + domain;
    }

    /**
     * Mask phone: 010-1234-5678 -> 010-****-5678
     */
    public String maskPhone(String phone) {
        if (phone == null || phone.length() < 8) {
            return phone;
        }
        // Handle various formats
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.length() < 8) {
            return phone;
        }

        if (phone.contains("-")) {
            String[] parts = phone.split("-");
            if (parts.length == 3) {
                return parts[0] + "-****-" + parts[2];
            }
        }

        // Default format: mask middle 4 digits
        int midStart = (digits.length() - 4) / 2;
        return digits.substring(0, midStart) + "****" + digits.substring(midStart + 4);
    }

    /**
     * Mask resident registration number: 900101-1234567 -> 900101-*******
     */
    public String maskResidentNumber(String rrn) {
        if (rrn == null || rrn.length() < 7) {
            return rrn;
        }
        if (rrn.contains("-")) {
            String[] parts = rrn.split("-");
            if (parts.length == 2) {
                return parts[0] + "-*******";
            }
        }
        return rrn.substring(0, 6) + "-*******";
    }

    /**
     * Mask account number: 123-456-789012 -> 123-***-***012
     */
    public String maskAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.length() < 6) {
            return accountNumber;
        }
        int length = accountNumber.length();
        String start = accountNumber.substring(0, 3);
        String end = accountNumber.substring(length - 3);
        return start + "*".repeat(length - 6) + end;
    }

    /**
     * Mask address: 서울시 강남구 삼성동 123-45 -> 서울시 강남구 ***
     */
    public String maskAddress(String address) {
        if (address == null || address.length() < 10) {
            return address;
        }
        // Find the position to mask (typically after district)
        String[] parts = address.split(" ");
        if (parts.length >= 3) {
            return parts[0] + " " + parts[1] + " ***";
        }
        return address.substring(0, address.length() / 2) + "***";
    }

    /**
     * Mask card number: 1234-5678-9012-3456 -> 1234-****-****-3456
     */
    public String maskCardNumber(String cardNumber) {
        if (cardNumber == null || cardNumber.length() < 12) {
            return cardNumber;
        }
        String digits = cardNumber.replaceAll("[^0-9]", "");
        if (digits.length() < 12) {
            return cardNumber;
        }

        String first4 = digits.substring(0, 4);
        String last4 = digits.substring(digits.length() - 4);
        return first4 + "-****-****-" + last4;
    }

    /**
     * Generic masking: show only first and last n characters.
     */
    public String maskGeneric(String value, int visibleChars) {
        if (value == null || value.length() <= visibleChars * 2) {
            return value;
        }
        String start = value.substring(0, visibleChars);
        String end = value.substring(value.length() - visibleChars);
        return start + "*".repeat(value.length() - visibleChars * 2) + end;
    }
}
