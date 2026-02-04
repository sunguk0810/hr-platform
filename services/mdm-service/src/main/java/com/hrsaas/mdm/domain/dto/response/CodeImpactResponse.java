package com.hrsaas.mdm.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 코드 변경 영향도 분석 결과
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeImpactResponse {

    private UUID codeId;
    private String groupCode;
    private String code;
    private String codeName;

    /**
     * 영향을 받는 테이블/서비스 목록
     */
    @Builder.Default
    private List<ImpactedResource> impactedResources = new ArrayList<>();

    /**
     * 하위 코드 수 (계층형 코드인 경우)
     */
    private int childCodeCount;

    /**
     * 테넌트별 커스터마이징 수
     */
    private int tenantMappingCount;

    /**
     * 총 영향도 점수 (0-100)
     */
    private int impactScore;

    /**
     * 영향도 수준 (LOW, MEDIUM, HIGH, CRITICAL)
     */
    private ImpactLevel impactLevel;

    /**
     * 변경 권장 사항
     */
    @Builder.Default
    private List<String> recommendations = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImpactedResource {
        private String resourceType; // TABLE, SERVICE, API, REPORT
        private String resourceName;
        private String description;
        private int estimatedRecordCount;
    }

    public enum ImpactLevel {
        LOW,      // 0-25
        MEDIUM,   // 26-50
        HIGH,     // 51-75
        CRITICAL  // 76-100
    }

    public void calculateImpactLevel() {
        if (impactScore <= 25) {
            this.impactLevel = ImpactLevel.LOW;
        } else if (impactScore <= 50) {
            this.impactLevel = ImpactLevel.MEDIUM;
        } else if (impactScore <= 75) {
            this.impactLevel = ImpactLevel.HIGH;
        } else {
            this.impactLevel = ImpactLevel.CRITICAL;
        }
    }

    public void addImpactedResource(ImpactedResource resource) {
        if (this.impactedResources == null) {
            this.impactedResources = new ArrayList<>();
        }
        this.impactedResources.add(resource);
    }

    public void addRecommendation(String recommendation) {
        if (this.recommendations == null) {
            this.recommendations = new ArrayList<>();
        }
        this.recommendations.add(recommendation);
    }
}
