package com.hrsaas.organization.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentSplitResponse {

    private UUID sourceDepartmentId;
    private List<DepartmentResponse> newDepartments;
    private boolean sourceKept;
}
