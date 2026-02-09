package com.hrsaas.tenant.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PoliciesDto {

    private Integer maxEmployees;
    private Integer maxDepartments;
    private List<String> allowedModules;
    private Object leavePolicy;
    private Object attendancePolicy;
    private Object approvalPolicy;
    private Object passwordPolicy;
    private Object securityPolicy;
    private Object notificationPolicy;
    private Object organizationPolicy;
}
