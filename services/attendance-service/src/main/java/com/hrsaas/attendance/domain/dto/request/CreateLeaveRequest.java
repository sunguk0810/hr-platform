package com.hrsaas.attendance.domain.dto.request;

import com.hrsaas.attendance.domain.entity.LeaveType;
import com.hrsaas.attendance.domain.entity.LeaveUnit;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLeaveRequest {

    @NotNull(message = "휴가 유형은 필수입니다")
    private LeaveType leaveType;

    @NotNull(message = "시작일은 필수입니다")
    private LocalDate startDate;

    @NotNull(message = "종료일은 필수입니다")
    private LocalDate endDate;

    private String reason;

    private String emergencyContact;

    private UUID handoverToId;

    private String handoverToName;

    private String handoverNotes;

    private LeaveUnit leaveUnit;

    private BigDecimal hoursCount;

    private boolean submitImmediately;
}
