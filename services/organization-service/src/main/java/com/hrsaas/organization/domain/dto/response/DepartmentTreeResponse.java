package com.hrsaas.organization.domain.dto.response;

import com.hrsaas.organization.domain.entity.Department;
import com.hrsaas.organization.domain.entity.DepartmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentTreeResponse {

    private UUID id;
    private String code;
    private String name;
    private String nameEn;
    private Integer level;
    private UUID managerId;
    private String managerName;
    private Integer employeeCount;
    private DepartmentStatus status;
    private Integer sortOrder;
    private List<DepartmentTreeResponse> children;

    public static DepartmentTreeResponse from(Department department) {
        return DepartmentTreeResponse.builder()
            .id(department.getId())
            .code(department.getCode())
            .name(department.getName())
            .nameEn(department.getNameEn())
            .level(department.getLevel())
            .managerId(department.getManagerId())
            .status(department.getStatus())
            .sortOrder(department.getSortOrder())
            .children(new ArrayList<>())
            .build();
    }

    public static DepartmentTreeResponse fromWithChildren(Department department) {
        DepartmentTreeResponse response = from(department);
        if (department.getChildren() != null && !department.getChildren().isEmpty()) {
            response.setChildren(department.getChildren().stream()
                .filter(Department::isActive)
                .map(DepartmentTreeResponse::fromWithChildren)
                .toList());
        }
        return response;
    }

    /**
     * in-memory 트리 구성용: 미리 빌드된 children 리스트를 사용합니다.
     */
    public static DepartmentTreeResponse fromWithChildren(Department department,
                                                            List<DepartmentTreeResponse> children) {
        DepartmentTreeResponse response = from(department);
        if (children != null && !children.isEmpty()) {
            response.setChildren(children);
        }
        return response;
    }
}
