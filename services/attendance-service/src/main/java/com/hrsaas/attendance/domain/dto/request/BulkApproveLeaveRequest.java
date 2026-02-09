package com.hrsaas.attendance.domain.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkApproveLeaveRequest {

    @NotEmpty(message = "승인할 휴가 신청 ID 목록은 필수입니다")
    private List<UUID> leaveRequestIds;

    private String comment;
}
