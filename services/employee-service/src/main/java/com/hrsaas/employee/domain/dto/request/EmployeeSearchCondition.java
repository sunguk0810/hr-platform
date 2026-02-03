package com.hrsaas.employee.domain.dto.request;

import com.hrsaas.employee.domain.entity.EmployeeStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeSearchCondition {

    private String name;
    private String employeeNumber;
    private UUID departmentId;
    private EmployeeStatus status;
    private String positionCode;
}
