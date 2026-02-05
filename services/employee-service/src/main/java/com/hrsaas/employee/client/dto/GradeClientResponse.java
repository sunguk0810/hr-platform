package com.hrsaas.employee.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO for grade information received from Organization Service
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeClientResponse {
    private UUID id;
    private String code;
    private String name;
    private Boolean isActive;
}
