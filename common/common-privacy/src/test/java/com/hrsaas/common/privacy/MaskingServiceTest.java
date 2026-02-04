package com.hrsaas.common.privacy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("MaskingService Tests")
class MaskingServiceTest {

    private MaskingService maskingService;

    @BeforeEach
    void setUp() {
        maskingService = new MaskingService();
    }

    @Nested
    @DisplayName("Name Masking")
    class NameMasking {

        @Test
        @DisplayName("3자 이름 마스킹: 홍길동 -> 홍*동")
        void maskName_threeCharacters_maskMiddle() {
            String result = maskingService.maskName("홍길동");
            assertThat(result).isEqualTo("홍*동");
        }

        @Test
        @DisplayName("2자 이름 마스킹: 홍길 -> 홍*")
        void maskName_twoCharacters_maskLast() {
            String result = maskingService.maskName("홍길");
            assertThat(result).isEqualTo("홍*");
        }

        @Test
        @DisplayName("4자 이름 마스킹: 홍길동일 -> 홍**일")
        void maskName_fourCharacters_maskMiddleTwo() {
            String result = maskingService.maskName("홍길동일");
            assertThat(result).isEqualTo("홍**일");
        }

        @Test
        @DisplayName("1자 이름: 그대로 반환")
        void maskName_oneCharacter_returnAsIs() {
            String result = maskingService.maskName("홍");
            assertThat(result).isEqualTo("홍");
        }

        @Test
        @DisplayName("null 입력: null 반환")
        void maskName_null_returnNull() {
            String result = maskingService.maskName(null);
            assertThat(result).isNull();
        }
    }

    @Nested
    @DisplayName("Email Masking")
    class EmailMasking {

        @Test
        @DisplayName("이메일 마스킹: user@example.com -> us***@example.com")
        void maskEmail_standard_maskLocalPart() {
            String result = maskingService.maskEmail("user@example.com");
            assertThat(result).isEqualTo("us***@example.com");
        }

        @Test
        @DisplayName("짧은 로컬파트: ab@test.com -> ab***@test.com")
        void maskEmail_shortLocalPart_keepAll() {
            String result = maskingService.maskEmail("ab@test.com");
            assertThat(result).isEqualTo("ab***@test.com");
        }

        @Test
        @DisplayName("@ 없는 문자열: 그대로 반환")
        void maskEmail_noAtSign_returnAsIs() {
            String result = maskingService.maskEmail("invalid-email");
            assertThat(result).isEqualTo("invalid-email");
        }

        @Test
        @DisplayName("null 입력: null 반환")
        void maskEmail_null_returnNull() {
            String result = maskingService.maskEmail(null);
            assertThat(result).isNull();
        }
    }

    @Nested
    @DisplayName("Phone Masking")
    class PhoneMasking {

        @Test
        @DisplayName("전화번호 마스킹: 010-1234-5678 -> 010-****-5678")
        void maskPhone_hyphenated_maskMiddle() {
            String result = maskingService.maskPhone("010-1234-5678");
            assertThat(result).isEqualTo("010-****-5678");
        }

        @Test
        @DisplayName("지역번호 전화: 02-123-4567 -> 02-****-4567")
        void maskPhone_localNumber_maskMiddle() {
            String result = maskingService.maskPhone("02-123-4567");
            assertThat(result).isEqualTo("02-****-4567");
        }

        @Test
        @DisplayName("짧은 전화번호: 그대로 반환")
        void maskPhone_tooShort_returnAsIs() {
            String result = maskingService.maskPhone("1234");
            assertThat(result).isEqualTo("1234");
        }

        @Test
        @DisplayName("null 입력: null 반환")
        void maskPhone_null_returnNull() {
            String result = maskingService.maskPhone(null);
            assertThat(result).isNull();
        }
    }

    @Nested
    @DisplayName("Resident Number Masking")
    class ResidentNumberMasking {

        @Test
        @DisplayName("주민번호 마스킹: 900101-1234567 -> 900101-*******")
        void maskResidentNumber_standard_maskBackPart() {
            String result = maskingService.maskResidentNumber("900101-1234567");
            assertThat(result).isEqualTo("900101-*******");
        }

        @Test
        @DisplayName("하이픈 없는 주민번호: 9001011234567 -> 900101-*******")
        void maskResidentNumber_noHyphen_addHyphenAndMask() {
            String result = maskingService.maskResidentNumber("9001011234567");
            assertThat(result).isEqualTo("900101-*******");
        }

        @Test
        @DisplayName("짧은 문자열: 그대로 반환")
        void maskResidentNumber_tooShort_returnAsIs() {
            String result = maskingService.maskResidentNumber("900101");
            assertThat(result).isEqualTo("900101");
        }

        @Test
        @DisplayName("null 입력: null 반환")
        void maskResidentNumber_null_returnNull() {
            String result = maskingService.maskResidentNumber(null);
            assertThat(result).isNull();
        }
    }

    @Nested
    @DisplayName("Account Number Masking")
    class AccountNumberMasking {

        @Test
        @DisplayName("계좌번호 마스킹: 123-456-789012 -> 123**********012")
        void maskAccountNumber_standard_maskMiddle() {
            String result = maskingService.maskAccountNumber("123-456-789012");
            assertThat(result).isEqualTo("123********012");
        }

        @Test
        @DisplayName("짧은 계좌번호: 그대로 반환")
        void maskAccountNumber_tooShort_returnAsIs() {
            String result = maskingService.maskAccountNumber("12345");
            assertThat(result).isEqualTo("12345");
        }

        @Test
        @DisplayName("null 입력: null 반환")
        void maskAccountNumber_null_returnNull() {
            String result = maskingService.maskAccountNumber(null);
            assertThat(result).isNull();
        }
    }

    @Nested
    @DisplayName("Address Masking")
    class AddressMasking {

        @Test
        @DisplayName("주소 마스킹: 서울시 강남구 삼성동 123-45 -> 서울시 강남구 ***")
        void maskAddress_standard_maskDetail() {
            String result = maskingService.maskAddress("서울시 강남구 삼성동 123-45");
            assertThat(result).isEqualTo("서울시 강남구 ***");
        }

        @Test
        @DisplayName("짧은 주소: 그대로 반환")
        void maskAddress_tooShort_returnAsIs() {
            String result = maskingService.maskAddress("서울시");
            assertThat(result).isEqualTo("서울시");
        }

        @Test
        @DisplayName("null 입력: null 반환")
        void maskAddress_null_returnNull() {
            String result = maskingService.maskAddress(null);
            assertThat(result).isNull();
        }
    }

    @Nested
    @DisplayName("Card Number Masking")
    class CardNumberMasking {

        @Test
        @DisplayName("카드번호 마스킹: 1234-5678-9012-3456 -> 1234-****-****-3456")
        void maskCardNumber_standard_maskMiddle() {
            String result = maskingService.maskCardNumber("1234-5678-9012-3456");
            assertThat(result).isEqualTo("1234-****-****-3456");
        }

        @Test
        @DisplayName("하이픈 없는 카드번호: 1234567890123456 -> 1234-****-****-3456")
        void maskCardNumber_noHyphen_formatAndMask() {
            String result = maskingService.maskCardNumber("1234567890123456");
            assertThat(result).isEqualTo("1234-****-****-3456");
        }

        @Test
        @DisplayName("짧은 카드번호: 그대로 반환")
        void maskCardNumber_tooShort_returnAsIs() {
            String result = maskingService.maskCardNumber("12345678");
            assertThat(result).isEqualTo("12345678");
        }

        @Test
        @DisplayName("null 입력: null 반환")
        void maskCardNumber_null_returnNull() {
            String result = maskingService.maskCardNumber(null);
            assertThat(result).isNull();
        }
    }

    @Nested
    @DisplayName("Generic Masking")
    class GenericMasking {

        @Test
        @DisplayName("일반 마스킹 (visibleChars=3): ABCDEFGH -> ABC**FGH")
        void maskGeneric_visibleThree_maskMiddle() {
            String result = maskingService.maskGeneric("ABCDEFGH", 3);
            assertThat(result).isEqualTo("ABC**FGH");
        }

        @Test
        @DisplayName("너무 짧은 문자열: 그대로 반환")
        void maskGeneric_tooShort_returnAsIs() {
            String result = maskingService.maskGeneric("ABCD", 3);
            assertThat(result).isEqualTo("ABCD");
        }

        @Test
        @DisplayName("null 입력: null 반환")
        void maskGeneric_null_returnNull() {
            String result = maskingService.maskGeneric(null, 3);
            assertThat(result).isNull();
        }
    }
}
