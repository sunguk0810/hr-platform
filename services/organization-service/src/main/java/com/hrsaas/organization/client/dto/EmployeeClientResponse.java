package com.hrsaas.organization.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeClientResponse {
    private UUID id;
    private String name;
    private String gradeName;
    private String positionName;
}
