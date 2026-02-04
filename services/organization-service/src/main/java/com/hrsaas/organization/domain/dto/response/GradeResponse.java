package com.hrsaas.organization.domain.dto.response;

import com.hrsaas.organization.domain.entity.Grade;
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
public class GradeResponse {

    private UUID id;
    private String code;
    private String name;
    private String nameEn;
    private Integer level;
    private Integer sortOrder;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;

    public static GradeResponse from(Grade grade) {
        return GradeResponse.builder()
            .id(grade.getId())
            .code(grade.getCode())
            .name(grade.getName())
            .nameEn(grade.getNameEn())
            .level(grade.getLevel())
            .sortOrder(grade.getSortOrder())
            .isActive(grade.getIsActive())
            .createdAt(grade.getCreatedAt())
            .updatedAt(grade.getUpdatedAt())
            .build();
    }
}
