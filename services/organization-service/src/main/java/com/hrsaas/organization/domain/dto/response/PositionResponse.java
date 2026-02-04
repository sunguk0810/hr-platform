package com.hrsaas.organization.domain.dto.response;

import com.hrsaas.organization.domain.entity.Position;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PositionResponse {

    private UUID id;
    private String code;
    private String name;
    private String nameEn;
    private Integer level;
    private Integer sortOrder;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;

    public static PositionResponse from(Position position) {
        return PositionResponse.builder()
            .id(position.getId())
            .code(position.getCode())
            .name(position.getName())
            .nameEn(position.getNameEn())
            .level(position.getLevel())
            .sortOrder(position.getSortOrder())
            .isActive(position.getIsActive())
            .createdAt(position.getCreatedAt())
            .updatedAt(position.getUpdatedAt())
            .build();
    }
}
