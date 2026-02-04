package com.hrsaas.common.privacy;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("PrivacyContext Tests")
class PrivacyContextTest {

    @BeforeEach
    void setUp() {
        PrivacyContext.clear();
    }

    @AfterEach
    void tearDown() {
        PrivacyContext.clear();
    }

    @Nested
    @DisplayName("Viewing Employee ID")
    class ViewingEmployeeId {

        @Test
        @DisplayName("설정한 값 조회")
        void setAndGet_viewingEmployeeId() {
            UUID employeeId = UUID.randomUUID();
            PrivacyContext.setViewingEmployeeId(employeeId);

            assertThat(PrivacyContext.getViewingEmployeeId()).isEqualTo(employeeId);
        }

        @Test
        @DisplayName("설정하지 않은 경우 null 반환")
        void get_notSet_returnNull() {
            assertThat(PrivacyContext.getViewingEmployeeId()).isNull();
        }
    }

    @Nested
    @DisplayName("Current Employee ID")
    class CurrentEmployeeId {

        @Test
        @DisplayName("설정한 값 조회")
        void setAndGet_currentEmployeeId() {
            UUID employeeId = UUID.randomUUID();
            PrivacyContext.setCurrentEmployeeId(employeeId);

            assertThat(PrivacyContext.getCurrentEmployeeId()).isEqualTo(employeeId);
        }

        @Test
        @DisplayName("설정하지 않은 경우 null 반환")
        void get_notSet_returnNull() {
            assertThat(PrivacyContext.getCurrentEmployeeId()).isNull();
        }
    }

    @Nested
    @DisplayName("Is Viewing Self")
    class IsViewingSelf {

        @Test
        @DisplayName("본인 데이터 조회: true")
        void isViewingSelf_sameId_returnTrue() {
            UUID employeeId = UUID.randomUUID();
            PrivacyContext.setCurrentEmployeeId(employeeId);
            PrivacyContext.setViewingEmployeeId(employeeId);

            assertThat(PrivacyContext.isViewingSelf()).isTrue();
        }

        @Test
        @DisplayName("타인 데이터 조회: false")
        void isViewingSelf_differentId_returnFalse() {
            PrivacyContext.setCurrentEmployeeId(UUID.randomUUID());
            PrivacyContext.setViewingEmployeeId(UUID.randomUUID());

            assertThat(PrivacyContext.isViewingSelf()).isFalse();
        }

        @Test
        @DisplayName("viewing ID 없음: false")
        void isViewingSelf_viewingNull_returnFalse() {
            PrivacyContext.setCurrentEmployeeId(UUID.randomUUID());

            assertThat(PrivacyContext.isViewingSelf()).isFalse();
        }
    }

    @Nested
    @DisplayName("Skip Masking")
    class SkipMasking {

        @Test
        @DisplayName("기본값: false")
        void shouldSkipMasking_default_returnFalse() {
            assertThat(PrivacyContext.shouldSkipMasking()).isFalse();
        }

        @Test
        @DisplayName("설정 후 조회: true")
        void shouldSkipMasking_setTrue_returnTrue() {
            PrivacyContext.setSkipMasking(true);

            assertThat(PrivacyContext.shouldSkipMasking()).isTrue();
        }
    }

    @Nested
    @DisplayName("Should Apply Masking")
    class ShouldApplyMasking {

        @Test
        @DisplayName("일반 사용자, 타인 조회: 마스킹 적용 (true)")
        void shouldApplyMasking_regularUser_viewingOther_returnTrue() {
            PrivacyContext.setCurrentEmployeeId(UUID.randomUUID());
            PrivacyContext.setViewingEmployeeId(UUID.randomUUID());

            assertThat(PrivacyContext.shouldApplyMasking()).isTrue();
        }

        @Test
        @DisplayName("일반 사용자, 본인 조회: 마스킹 비적용 (false)")
        void shouldApplyMasking_regularUser_viewingSelf_returnFalse() {
            UUID employeeId = UUID.randomUUID();
            PrivacyContext.setCurrentEmployeeId(employeeId);
            PrivacyContext.setViewingEmployeeId(employeeId);

            assertThat(PrivacyContext.shouldApplyMasking()).isFalse();
        }

        @Test
        @DisplayName("관리자 (skipMasking=true): 마스킹 비적용 (false)")
        void shouldApplyMasking_adminUser_returnFalse() {
            PrivacyContext.setSkipMasking(true);
            PrivacyContext.setCurrentEmployeeId(UUID.randomUUID());
            PrivacyContext.setViewingEmployeeId(UUID.randomUUID());

            assertThat(PrivacyContext.shouldApplyMasking()).isFalse();
        }

        @Test
        @DisplayName("컨텍스트 없음: 마스킹 적용 (true)")
        void shouldApplyMasking_noContext_returnTrue() {
            assertThat(PrivacyContext.shouldApplyMasking()).isTrue();
        }
    }

    @Nested
    @DisplayName("Clear Context")
    class ClearContext {

        @Test
        @DisplayName("clear 호출 후 모든 값 초기화")
        void clear_allValuesReset() {
            PrivacyContext.setCurrentEmployeeId(UUID.randomUUID());
            PrivacyContext.setViewingEmployeeId(UUID.randomUUID());
            PrivacyContext.setSkipMasking(true);

            PrivacyContext.clear();

            assertThat(PrivacyContext.getCurrentEmployeeId()).isNull();
            assertThat(PrivacyContext.getViewingEmployeeId()).isNull();
            assertThat(PrivacyContext.shouldSkipMasking()).isFalse();
        }
    }
}
