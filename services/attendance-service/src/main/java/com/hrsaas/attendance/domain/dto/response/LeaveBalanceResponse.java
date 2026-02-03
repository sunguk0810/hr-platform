package com.hrsaas.attendance.domain.dto.response;

import com.hrsaas.attendance.domain.entity.LeaveBalance;
import com.hrsaas.attendance.domain.entity.LeaveType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveBalanceResponse {

    private UUID id;
    private UUID employeeId;
    private Integer year;
    private LeaveType leaveType;
    private BigDecimal totalDays;
    private BigDecimal usedDays;
    private BigDecimal pendingDays;
    private BigDecimal carriedOverDays;
    private BigDecimal availableDays;

    public static LeaveBalanceResponse from(LeaveBalance balance) {
        return LeaveBalanceResponse.builder()
            .id(balance.getId())
            .employeeId(balance.getEmployeeId())
            .year(balance.getYear())
            .leaveType(balance.getLeaveType())
            .totalDays(balance.getTotalDays())
            .usedDays(balance.getUsedDays())
            .pendingDays(balance.getPendingDays())
            .carriedOverDays(balance.getCarriedOverDays())
            .availableDays(balance.getAvailableDays())
            .build();
    }
}
