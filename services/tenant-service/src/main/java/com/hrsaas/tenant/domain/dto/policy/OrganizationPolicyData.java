package com.hrsaas.tenant.domain.dto.policy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationPolicyData {

    private Integer maxDepartmentDepth;
    private String positionSystem;
    private Integer gradeCount;
    private Boolean teamEnabled;
    private Boolean matrixOrganizationEnabled;
    private Boolean concurrentPositionEnabled;
}
