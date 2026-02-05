package com.hrsaas.employee.domain.dto.request;

import jakarta.validation.constraints.NotNull;
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
public class CreateTransferRequest {

    @NotNull(message = "직원 ID는 필수입니다.")
    private UUID employeeId;

    @NotNull(message = "전입 테넌트 ID는 필수입니다.")
    private UUID targetTenantId;

    private UUID targetDepartmentId;
    private UUID targetPositionId;
    private UUID targetGradeId;

    @NotNull(message = "전출/전입 예정일은 필수입니다.")
    private LocalDate transferDate;

    private String reason;
}
