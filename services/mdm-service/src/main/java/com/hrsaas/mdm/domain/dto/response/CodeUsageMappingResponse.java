package com.hrsaas.mdm.domain.dto.response;

import com.hrsaas.mdm.domain.entity.CodeUsageMapping;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * 코드 사용처 매핑 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeUsageMappingResponse {

    private UUID id;
    private String groupCode;
    private String resourceType;
    private String resourceName;
    private String description;
    private String estimatedImpact;
    private Instant createdAt;
    private Instant updatedAt;

    public static CodeUsageMappingResponse from(CodeUsageMapping mapping) {
        return CodeUsageMappingResponse.builder()
            .id(mapping.getId())
            .groupCode(mapping.getGroupCode())
            .resourceType(mapping.getResourceType())
            .resourceName(mapping.getResourceName())
            .description(mapping.getDescription())
            .estimatedImpact(mapping.getEstimatedImpact())
            .createdAt(mapping.getCreatedAt())
            .updatedAt(mapping.getUpdatedAt())
            .build();
    }
}
