package com.hrsaas.attendance.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeBasicDto {
    private UUID id;
    private String name;
    private LocalDate hireDate;
    private String gender;
    private String status;
}
