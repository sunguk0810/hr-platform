package com.hrsaas.organization.domain.dto.response;

import com.hrsaas.organization.domain.entity.Department;
import com.hrsaas.organization.domain.entity.DepartmentStatus;
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
public class DepartmentResponse {

    private UUID id;
    private String code;
    private String name;
    private String nameEn;
    private UUID parentId;
    private String parentName;
    private Integer level;
    private String path;
    private UUID managerId;
    private String managerName;
    private Integer employeeCount;
    private DepartmentStatus status;
    private Integer sortOrder;
    private Instant createdAt;
    private Instant updatedAt;

    public static DepartmentResponse from(Department department) {
        return DepartmentResponse.builder()
            .id(department.getId())
            .code(department.getCode())
            .name(department.getName())
            .nameEn(department.getNameEn())
            .parentId(department.getParent() != null ? department.getParent().getId() : null)
            .parentName(department.getParent() != null ? department.getParent().getName() : null)
            .level(department.getLevel())
            .path(department.getPath())
            .managerId(department.getManagerId())
            .status(department.getStatus())
            .sortOrder(department.getSortOrder())
            .createdAt(department.getCreatedAt())
            .updatedAt(department.getUpdatedAt())
            .build();
    }
}
