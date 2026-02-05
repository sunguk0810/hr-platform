package com.hrsaas.employee.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO for department information received from Organization Service
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentClientResponse {
    private UUID id;
    private String code;
    private String name;
    private String status;
}
