package com.hrsaas.attendance.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkRejectLeaveRequest {

    @NotEmpty(message = "반려할 휴가 신청 ID 목록은 필수입니다")
    private List<UUID> leaveRequestIds;

    @NotBlank(message = "반려 사유는 필수입니다")
    private String reason;
}
