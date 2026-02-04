package com.hrsaas.common.core.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("StringUtils Tests")
class StringUtilsTest {

    @Nested
    @DisplayName("Blank/Empty Check Methods")
    class BlankEmptyCheckMethods {

        @Test
        @DisplayName("isBlank: null은 blank")
        void isBlank_null_returnTrue() {
            assertThat(StringUtils.isBlank(null)).isTrue();
        }

        @Test
        @DisplayName("isBlank: 빈 문자열은 blank")
        void isBlank_emptyString_returnTrue() {
            assertThat(StringUtils.isBlank("")).isTrue();
        }

        @Test
        @DisplayName("isBlank: 공백만 있는 문자열은 blank")
        void isBlank_whitespaceOnly_returnTrue() {
            assertThat(StringUtils.isBlank("   ")).isTrue();
        }

        @Test
        @DisplayName("isBlank: 일반 문자열은 not blank")
        void isBlank_normalString_returnFalse() {
            assertThat(StringUtils.isBlank("hello")).isFalse();
        }

        @Test
        @DisplayName("isNotBlank: null은 false")
        void isNotBlank_null_returnFalse() {
            assertThat(StringUtils.isNotBlank(null)).isFalse();
        }

        @Test
        @DisplayName("isNotBlank: 일반 문자열은 true")
        void isNotBlank_normalString_returnTrue() {
            assertThat(StringUtils.isNotBlank("hello")).isTrue();
        }

        @Test
        @DisplayName("isEmpty: null은 empty")
        void isEmpty_null_returnTrue() {
            assertThat(StringUtils.isEmpty(null)).isTrue();
        }

        @Test
        @DisplayName("isEmpty: 빈 문자열은 empty")
        void isEmpty_emptyString_returnTrue() {
            assertThat(StringUtils.isEmpty("")).isTrue();
        }

        @Test
        @DisplayName("isEmpty: 공백 문자열은 not empty")
        void isEmpty_whitespaceOnly_returnFalse() {
            assertThat(StringUtils.isEmpty("   ")).isFalse();
        }

        @Test
        @DisplayName("isNotEmpty: 일반 문자열은 true")
        void isNotEmpty_normalString_returnTrue() {
            assertThat(StringUtils.isNotEmpty("hello")).isTrue();
        }
    }

    @Nested
    @DisplayName("Trim and Default Methods")
    class TrimDefaultMethods {

        @Test
        @DisplayName("trim: 앞뒤 공백 제거")
        void trim_withWhitespace_trimWhitespace() {
            assertThat(StringUtils.trim("  hello  ")).isEqualTo("hello");
        }

        @Test
        @DisplayName("trim: null이면 null 반환")
        void trim_null_returnNull() {
            assertThat(StringUtils.trim(null)).isNull();
        }

        @Test
        @DisplayName("defaultIfBlank: blank면 기본값 반환")
        void defaultIfBlank_blankString_returnDefault() {
            assertThat(StringUtils.defaultIfBlank("", "default")).isEqualTo("default");
            assertThat(StringUtils.defaultIfBlank("   ", "default")).isEqualTo("default");
            assertThat(StringUtils.defaultIfBlank(null, "default")).isEqualTo("default");
        }

        @Test
        @DisplayName("defaultIfBlank: not blank면 원래 값 반환")
        void defaultIfBlank_notBlank_returnOriginal() {
            assertThat(StringUtils.defaultIfBlank("hello", "default")).isEqualTo("hello");
        }
    }

    @Nested
    @DisplayName("Validation Methods")
    class ValidationMethods {

        @Test
        @DisplayName("isValidEmail: 유효한 이메일 형식")
        void isValidEmail_validFormat_returnTrue() {
            assertThat(StringUtils.isValidEmail("user@example.com")).isTrue();
            assertThat(StringUtils.isValidEmail("test.user+tag@domain.co.kr")).isTrue();
        }

        @Test
        @DisplayName("isValidEmail: 유효하지 않은 이메일 형식")
        void isValidEmail_invalidFormat_returnFalse() {
            assertThat(StringUtils.isValidEmail("invalid")).isFalse();
            assertThat(StringUtils.isValidEmail("@example.com")).isFalse();
            assertThat(StringUtils.isValidEmail(null)).isFalse();
        }

        @Test
        @DisplayName("isValidPhone: 유효한 전화번호 형식")
        void isValidPhone_validFormat_returnTrue() {
            assertThat(StringUtils.isValidPhone("010-1234-5678")).isTrue();
            assertThat(StringUtils.isValidPhone("02-123-4567")).isTrue();
            assertThat(StringUtils.isValidPhone("031-1234-5678")).isTrue();
        }

        @Test
        @DisplayName("isValidPhone: 유효하지 않은 전화번호 형식")
        void isValidPhone_invalidFormat_returnFalse() {
            assertThat(StringUtils.isValidPhone("01012345678")).isFalse();
            assertThat(StringUtils.isValidPhone("123-456-789")).isFalse();
            assertThat(StringUtils.isValidPhone(null)).isFalse();
        }
    }

    @Nested
    @DisplayName("UUID Methods")
    class UuidMethods {

        @Test
        @DisplayName("generateUUID: 유효한 UUID 생성")
        void generateUUID_generatesValidUuid() {
            String result = StringUtils.generateUUID();
            assertThat(result).isNotNull();
            assertThat(result).matches("[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}");
        }

        @Test
        @DisplayName("generateShortUUID: 8자리 UUID 생성")
        void generateShortUUID_generates8CharUuid() {
            String result = StringUtils.generateShortUUID();
            assertThat(result).isNotNull();
            assertThat(result).hasSize(8);
            assertThat(result).matches("[a-f0-9]{8}");
        }

        @Test
        @DisplayName("parseUUID: 유효한 UUID 문자열 파싱")
        void parseUUID_validString_returnUuid() {
            String uuidStr = "550e8400-e29b-41d4-a716-446655440000";
            UUID result = StringUtils.parseUUID(uuidStr);
            assertThat(result).isNotNull();
            assertThat(result.toString()).isEqualTo(uuidStr);
        }

        @Test
        @DisplayName("parseUUID: 유효하지 않은 문자열은 null 반환")
        void parseUUID_invalidString_returnNull() {
            assertThat(StringUtils.parseUUID("invalid-uuid")).isNull();
            assertThat(StringUtils.parseUUID("")).isNull();
            assertThat(StringUtils.parseUUID(null)).isNull();
        }
    }

    @Nested
    @DisplayName("Masking and Truncation Methods")
    class MaskingTruncationMethods {

        @Test
        @DisplayName("maskMiddle: 가운데 부분 마스킹")
        void maskMiddle_validString_maskMiddlePart() {
            String result = StringUtils.maskMiddle("ABCDEFGH", 2);
            assertThat(result).isEqualTo("AB****GH");
        }

        @Test
        @DisplayName("maskMiddle: 문자열이 너무 짧으면 그대로 반환")
        void maskMiddle_tooShort_returnAsIs() {
            assertThat(StringUtils.maskMiddle("ABCD", 3)).isEqualTo("ABCD");
        }

        @Test
        @DisplayName("maskMiddle: null이면 null 반환")
        void maskMiddle_null_returnNull() {
            assertThat(StringUtils.maskMiddle(null, 2)).isNull();
        }

        @Test
        @DisplayName("truncate: 최대 길이로 자르기")
        void truncate_exceedsMaxLength_truncateString() {
            assertThat(StringUtils.truncate("Hello World", 5)).isEqualTo("Hello");
        }

        @Test
        @DisplayName("truncate: 최대 길이 이하면 그대로 반환")
        void truncate_withinMaxLength_returnAsIs() {
            assertThat(StringUtils.truncate("Hello", 10)).isEqualTo("Hello");
        }

        @Test
        @DisplayName("truncate: null이면 null 반환")
        void truncate_null_returnNull() {
            assertThat(StringUtils.truncate(null, 5)).isNull();
        }
    }

    @Nested
    @DisplayName("Case Conversion Methods")
    class CaseConversionMethods {

        @Test
        @DisplayName("toSnakeCase: camelCase를 snake_case로 변환")
        void toSnakeCase_camelCase_convertToSnakeCase() {
            assertThat(StringUtils.toSnakeCase("camelCaseString")).isEqualTo("camel_case_string");
            assertThat(StringUtils.toSnakeCase("myVariableName")).isEqualTo("my_variable_name");
        }

        @Test
        @DisplayName("toSnakeCase: 이미 소문자면 그대로")
        void toSnakeCase_alreadyLowercase_returnAsIs() {
            assertThat(StringUtils.toSnakeCase("lowercase")).isEqualTo("lowercase");
        }

        @Test
        @DisplayName("toSnakeCase: blank면 그대로 반환")
        void toSnakeCase_blank_returnAsIs() {
            assertThat(StringUtils.toSnakeCase(null)).isNull();
            assertThat(StringUtils.toSnakeCase("")).isEqualTo("");
        }

        @Test
        @DisplayName("toCamelCase: snake_case를 camelCase로 변환")
        void toCamelCase_snakeCase_convertToCamelCase() {
            assertThat(StringUtils.toCamelCase("snake_case_string")).isEqualTo("snakeCaseString");
            assertThat(StringUtils.toCamelCase("my_variable_name")).isEqualTo("myVariableName");
        }

        @Test
        @DisplayName("toCamelCase: kebab-case도 변환")
        void toCamelCase_kebabCase_convertToCamelCase() {
            assertThat(StringUtils.toCamelCase("kebab-case-string")).isEqualTo("kebabCaseString");
        }

        @Test
        @DisplayName("toCamelCase: blank면 그대로 반환")
        void toCamelCase_blank_returnAsIs() {
            assertThat(StringUtils.toCamelCase(null)).isNull();
            assertThat(StringUtils.toCamelCase("")).isEqualTo("");
        }
    }
}
