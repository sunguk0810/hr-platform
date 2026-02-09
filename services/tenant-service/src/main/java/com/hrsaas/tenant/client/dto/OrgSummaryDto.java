package com.hrsaas.tenant.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrgSummaryDto {

    private long departmentCount;
    private long positionCount;
}
