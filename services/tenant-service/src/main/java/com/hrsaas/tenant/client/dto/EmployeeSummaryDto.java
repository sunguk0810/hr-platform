package com.hrsaas.tenant.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeSummaryDto {

    private long totalEmployees;
    private long activeEmployees;
    private long newHiresThisMonth;
    private long resignedThisMonth;
}
