package com.hrsaas.organization.domain.dto.request;

import com.hrsaas.organization.domain.entity.CommitteeStatus;
import com.hrsaas.organization.domain.entity.CommitteeType;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCommitteeRequest {

    @Size(max = 200, message = "위원회 명칭은 200자 이하여야 합니다.")
    private String name;

    @Size(max = 200, message = "영문 명칭은 200자 이하여야 합니다.")
    private String nameEn;

    private CommitteeType type;

    private String purpose;

    private LocalDate startDate;

    private LocalDate endDate;

    @Size(max = 500, message = "회의 일정은 500자 이하여야 합니다.")
    private String meetingSchedule;

    private CommitteeStatus status;
}
