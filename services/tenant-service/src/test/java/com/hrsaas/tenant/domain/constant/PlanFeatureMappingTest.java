package com.hrsaas.tenant.domain.constant;

import com.hrsaas.tenant.domain.entity.PlanType;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.*;

class PlanFeatureMappingTest {

    @Test
    void getFeatures_basic_returns4Features() {
        Set<String> features = PlanFeatureMapping.getFeatures(PlanType.BASIC);

        assertThat(features).hasSize(4);
        assertThat(features).containsExactlyInAnyOrder(
                FeatureCode.EMPLOYEE,
                FeatureCode.ORGANIZATION,
                FeatureCode.ATTENDANCE,
                FeatureCode.LEAVE
        );
    }

    @Test
    void getFeatures_standard_returns8Features() {
        Set<String> features = PlanFeatureMapping.getFeatures(PlanType.STANDARD);

        assertThat(features).hasSize(8);
        assertThat(features).containsExactlyInAnyOrder(
                FeatureCode.EMPLOYEE,
                FeatureCode.ORGANIZATION,
                FeatureCode.ATTENDANCE,
                FeatureCode.LEAVE,
                FeatureCode.APPROVAL,
                FeatureCode.NOTIFICATION,
                FeatureCode.MDM,
                FeatureCode.FILE
        );
    }

    @Test
    void getFeatures_premium_returns14Features() {
        Set<String> features = PlanFeatureMapping.getFeatures(PlanType.PREMIUM);

        assertThat(features).hasSize(14);
        assertThat(features).contains(
                FeatureCode.EMPLOYEE,
                FeatureCode.ORGANIZATION,
                FeatureCode.ATTENDANCE,
                FeatureCode.LEAVE,
                FeatureCode.APPROVAL,
                FeatureCode.NOTIFICATION,
                FeatureCode.MDM,
                FeatureCode.FILE,
                FeatureCode.APPOINTMENT,
                FeatureCode.CERTIFICATE,
                FeatureCode.RECRUITMENT,
                FeatureCode.OVERTIME,
                FeatureCode.FLEXIBLE_WORK,
                FeatureCode.MULTI_COMPANY
        );
    }

    @Test
    void getFeatures_enterprise_returns16Features() {
        Set<String> features = PlanFeatureMapping.getFeatures(PlanType.ENTERPRISE);

        assertThat(features).hasSize(16);
        assertThat(features).contains(
                FeatureCode.EMPLOYEE,
                FeatureCode.ORGANIZATION,
                FeatureCode.ATTENDANCE,
                FeatureCode.LEAVE,
                FeatureCode.APPROVAL,
                FeatureCode.NOTIFICATION,
                FeatureCode.MDM,
                FeatureCode.FILE,
                FeatureCode.APPOINTMENT,
                FeatureCode.CERTIFICATE,
                FeatureCode.RECRUITMENT,
                FeatureCode.OVERTIME,
                FeatureCode.FLEXIBLE_WORK,
                FeatureCode.MULTI_COMPANY,
                FeatureCode.API_INTEGRATION,
                FeatureCode.GROUP_DASHBOARD
        );
    }

    @Test
    void isAllowed_basicWithEmployee_returnsTrue() {
        assertThat(PlanFeatureMapping.isAllowed(PlanType.BASIC, FeatureCode.EMPLOYEE)).isTrue();
    }

    @Test
    void isAllowed_basicWithAppointment_returnsFalse() {
        assertThat(PlanFeatureMapping.isAllowed(PlanType.BASIC, FeatureCode.APPOINTMENT)).isFalse();
    }
}
