package com.hrsaas.common.response;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("ApiResponse Tests")
class ApiResponseTest {

    @Nested
    @DisplayName("Success Factory Methods")
    class SuccessFactoryMethods {

        @Test
        @DisplayName("success(data): 데이터와 함께 성공 응답 생성")
        void success_withData_createSuccessResponse() {
            String testData = "test data";

            ApiResponse<String> response = ApiResponse.success(testData);

            assertThat(response.isSuccess()).isTrue();
            assertThat(response.getData()).isEqualTo(testData);
            assertThat(response.getMessage()).isNull();
            assertThat(response.getCode()).isNull();
            assertThat(response.getTimestamp()).isNotNull();
            assertThat(response.getTimestamp()).isBeforeOrEqualTo(Instant.now());
        }

        @Test
        @DisplayName("success(null): null 데이터도 허용")
        void success_withNullData_createSuccessResponse() {
            ApiResponse<String> response = ApiResponse.success(null);

            assertThat(response.isSuccess()).isTrue();
            assertThat(response.getData()).isNull();
        }

        @Test
        @DisplayName("success(data, message): 데이터와 메시지 함께 생성")
        void success_withDataAndMessage_createSuccessResponse() {
            List<Integer> testData = List.of(1, 2, 3);
            String message = "조회 성공";

            ApiResponse<List<Integer>> response = ApiResponse.success(testData, message);

            assertThat(response.isSuccess()).isTrue();
            assertThat(response.getData()).hasSize(3);
            assertThat(response.getMessage()).isEqualTo(message);
            assertThat(response.getTimestamp()).isNotNull();
        }

        @Test
        @DisplayName("success: 복잡한 객체 타입도 지원")
        void success_withComplexObject_createSuccessResponse() {
            TestDto testDto = new TestDto(1L, "test");

            ApiResponse<TestDto> response = ApiResponse.success(testDto);

            assertThat(response.isSuccess()).isTrue();
            assertThat(response.getData()).isEqualTo(testDto);
            assertThat(response.getData().id()).isEqualTo(1L);
            assertThat(response.getData().name()).isEqualTo("test");
        }
    }

    @Nested
    @DisplayName("Created Factory Method")
    class CreatedFactoryMethod {

        @Test
        @DisplayName("created(data): CREATED 코드와 함께 응답 생성")
        void created_withData_createCreatedResponse() {
            TestDto testDto = new TestDto(1L, "created item");

            ApiResponse<TestDto> response = ApiResponse.created(testDto);

            assertThat(response.isSuccess()).isTrue();
            assertThat(response.getData()).isEqualTo(testDto);
            assertThat(response.getCode()).isEqualTo("CREATED");
            assertThat(response.getMessage()).isNull();
            assertThat(response.getTimestamp()).isNotNull();
        }
    }

    @Nested
    @DisplayName("Error Factory Methods")
    class ErrorFactoryMethods {

        @Test
        @DisplayName("error(code, message): 에러 응답 생성")
        void error_withCodeAndMessage_createErrorResponse() {
            String code = "ERR_001";
            String message = "에러가 발생했습니다.";

            ApiResponse<Void> response = ApiResponse.error(code, message);

            assertThat(response.isSuccess()).isFalse();
            assertThat(response.getData()).isNull();
            assertThat(response.getCode()).isEqualTo(code);
            assertThat(response.getMessage()).isEqualTo(message);
            assertThat(response.getTimestamp()).isNotNull();
        }

        @Test
        @DisplayName("error(code, message, data): 에러 데이터와 함께 응답 생성")
        void error_withCodeMessageAndData_createErrorResponse() {
            String code = "VALIDATION_ERROR";
            String message = "입력값이 올바르지 않습니다.";
            List<String> errors = List.of("이름은 필수입니다.", "이메일 형식이 올바르지 않습니다.");

            ApiResponse<List<String>> response = ApiResponse.error(code, message, errors);

            assertThat(response.isSuccess()).isFalse();
            assertThat(response.getCode()).isEqualTo(code);
            assertThat(response.getMessage()).isEqualTo(message);
            assertThat(response.getData()).hasSize(2);
            assertThat(response.getTimestamp()).isNotNull();
        }
    }

    @Nested
    @DisplayName("Builder Pattern")
    class BuilderPattern {

        @Test
        @DisplayName("builder: 모든 필드 설정 가능")
        void builder_allFields_createCustomResponse() {
            Instant timestamp = Instant.now();

            ApiResponse<String> response = ApiResponse.<String>builder()
                .success(true)
                .data("custom data")
                .message("custom message")
                .code("CUSTOM_CODE")
                .timestamp(timestamp)
                .build();

            assertThat(response.isSuccess()).isTrue();
            assertThat(response.getData()).isEqualTo("custom data");
            assertThat(response.getMessage()).isEqualTo("custom message");
            assertThat(response.getCode()).isEqualTo("CUSTOM_CODE");
            assertThat(response.getTimestamp()).isEqualTo(timestamp);
        }
    }

    @Nested
    @DisplayName("Timestamp Generation")
    class TimestampGeneration {

        @Test
        @DisplayName("모든 팩토리 메서드가 timestamp 자동 생성")
        void factoryMethods_automaticallySetTimestamp() {
            Instant before = Instant.now();

            ApiResponse<String> success = ApiResponse.success("data");
            ApiResponse<String> successWithMessage = ApiResponse.success("data", "msg");
            ApiResponse<String> created = ApiResponse.created("data");
            ApiResponse<Void> error = ApiResponse.error("ERR", "msg");

            Instant after = Instant.now();

            assertThat(success.getTimestamp()).isBetween(before, after.plusMillis(1));
            assertThat(successWithMessage.getTimestamp()).isBetween(before, after.plusMillis(1));
            assertThat(created.getTimestamp()).isBetween(before, after.plusMillis(1));
            assertThat(error.getTimestamp()).isBetween(before, after.plusMillis(1));
        }
    }

    @Nested
    @DisplayName("Generic Type Safety")
    class GenericTypeSafety {

        @Test
        @DisplayName("다양한 제네릭 타입 지원")
        void success_variousGenericTypes_workCorrectly() {
            ApiResponse<String> stringResponse = ApiResponse.success("string");
            ApiResponse<Integer> intResponse = ApiResponse.success(42);
            ApiResponse<List<String>> listResponse = ApiResponse.success(List.of("a", "b"));

            assertThat(stringResponse.getData()).isInstanceOf(String.class);
            assertThat(intResponse.getData()).isInstanceOf(Integer.class);
            assertThat(listResponse.getData()).isInstanceOf(List.class);
        }
    }

    // Test DTO for complex object tests
    record TestDto(Long id, String name) {}
}
