package com.hrsaas.tenant.domain.constant;

import com.hrsaas.tenant.domain.entity.PlanType;

import java.util.Collections;
import java.util.EnumMap;
import java.util.Map;
import java.util.Set;

public final class PlanFeatureMapping {

    private PlanFeatureMapping() {}

    private static final Map<PlanType, Set<String>> PLAN_FEATURES;

    static {
        Map<PlanType, Set<String>> map = new EnumMap<>(PlanType.class);

        map.put(PlanType.BASIC, Set.of(
            FeatureCode.EMPLOYEE,
            FeatureCode.ORGANIZATION,
            FeatureCode.ATTENDANCE,
            FeatureCode.LEAVE
        ));

        map.put(PlanType.STANDARD, Set.of(
            FeatureCode.EMPLOYEE,
            FeatureCode.ORGANIZATION,
            FeatureCode.ATTENDANCE,
            FeatureCode.LEAVE,
            FeatureCode.APPROVAL,
            FeatureCode.NOTIFICATION,
            FeatureCode.MDM,
            FeatureCode.FILE
        ));

        map.put(PlanType.PREMIUM, Set.of(
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
        ));

        map.put(PlanType.ENTERPRISE, Set.of(
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
        ));

        PLAN_FEATURES = Collections.unmodifiableMap(map);
    }

    public static boolean isAllowed(PlanType planType, String featureCode) {
        Set<String> features = PLAN_FEATURES.get(planType);
        return features != null && features.contains(featureCode);
    }

    public static Set<String> getFeatures(PlanType planType) {
        return PLAN_FEATURES.getOrDefault(planType, Set.of());
    }
}
