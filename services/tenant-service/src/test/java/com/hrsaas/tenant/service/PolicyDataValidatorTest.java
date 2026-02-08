package com.hrsaas.tenant.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.tenant.domain.entity.PolicyType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class PolicyDataValidatorTest {

    private PolicyDataValidator validator;

    @BeforeEach
    void setUp() {
        validator = new PolicyDataValidator(new ObjectMapper());
    }

    @Test
    void validate_passwordValid_noException() {
        String json = "{\"minLength\":10,\"maxLength\":20,\"requireUppercase\":true," +
                "\"requireLowercase\":true,\"requireDigit\":true,\"requireSpecialChar\":true," +
                "\"minCharTypes\":4,\"expiryDays\":90,\"historyCount\":5,\"expiryWarningDays\":14}";

        assertThatCode(() -> validator.validate(PolicyType.PASSWORD, json))
                .doesNotThrowAnyException();
    }

    @Test
    void validate_passwordMinLengthTooShort_throwsTNT008() {
        String json = "{\"minLength\":5,\"maxLength\":20,\"requireUppercase\":true," +
                "\"requireLowercase\":true,\"requireDigit\":true,\"requireSpecialChar\":true," +
                "\"minCharTypes\":4,\"expiryDays\":90,\"historyCount\":5,\"expiryWarningDays\":14}";

        assertThatThrownBy(() -> validator.validate(PolicyType.PASSWORD, json))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode()).isEqualTo("TNT_008"));
    }

    @Test
    void validate_passwordMinCharTypesTooLow_throwsTNT008() {
        String json = "{\"minLength\":10,\"maxLength\":20,\"requireUppercase\":true," +
                "\"requireLowercase\":true,\"requireDigit\":true,\"requireSpecialChar\":true," +
                "\"minCharTypes\":2,\"expiryDays\":90,\"historyCount\":5,\"expiryWarningDays\":14}";

        assertThatThrownBy(() -> validator.validate(PolicyType.PASSWORD, json))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode()).isEqualTo("TNT_008"));
    }

    @Test
    void validate_attendanceValid_noException() {
        String json = "{\"workStartTime\":\"09:00\",\"workEndTime\":\"18:00\",\"standardWorkHours\":8}";

        assertThatCode(() -> validator.validate(PolicyType.ATTENDANCE, json))
                .doesNotThrowAnyException();
    }

    @Test
    void validate_leaveValid_noException() {
        String json = "{\"annualLeaveBaseCount\":15,\"carryOverEnabled\":true}";

        assertThatCode(() -> validator.validate(PolicyType.LEAVE, json))
                .doesNotThrowAnyException();
    }

    @Test
    void validate_approvalValid_noException() {
        String json = "{\"escalationDays\":3,\"maxApprovalLevels\":5}";

        assertThatCode(() -> validator.validate(PolicyType.APPROVAL, json))
                .doesNotThrowAnyException();
    }

    @Test
    void validate_securityValid_noException() {
        String json = "{\"sessionTimeoutMinutes\":30,\"maxSessions\":3}";

        assertThatCode(() -> validator.validate(PolicyType.SECURITY, json))
                .doesNotThrowAnyException();
    }

    @Test
    void validate_notificationValid_noException() {
        String json = "{\"emailEnabled\":true,\"smsEnabled\":false}";

        assertThatCode(() -> validator.validate(PolicyType.NOTIFICATION, json))
                .doesNotThrowAnyException();
    }

    @Test
    void validate_organizationValid_noException() {
        String json = "{\"maxDepartmentDepth\":5,\"positionSystem\":\"GRADE\"}";

        assertThatCode(() -> validator.validate(PolicyType.ORGANIZATION, json))
                .doesNotThrowAnyException();
    }

    @Test
    void validate_invalidJson_throwsTNT005() {
        String invalidJson = "not-a-valid-json{{{";

        assertThatThrownBy(() -> validator.validate(PolicyType.PASSWORD, invalidJson))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode()).isEqualTo("TNT_005"));
    }
}
