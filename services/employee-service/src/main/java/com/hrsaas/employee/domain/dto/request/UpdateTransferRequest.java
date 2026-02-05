package com.hrsaas.employee.domain.dto.request;

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
public class UpdateTransferRequest {

    private UUID targetDepartmentId;
    private UUID targetPositionId;
    private UUID targetGradeId;
    private LocalDate transferDate;
    private String reason;
}
