package com.hrsaas.organization.domain.dto.request;

import com.hrsaas.organization.domain.entity.HeadcountRequestType;
import jakarta.validation.constraints.Min;
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
public class UpdateHeadcountRequestRequest {

    private HeadcountRequestType type;

    @Min(value = 1, message = "요청 인원은 1 이상이어야 합니다.")
    private Integer requestCount;

    private UUID gradeId;

    private String gradeName;

    private UUID positionId;

    private String positionName;

    private String reason;

    private LocalDate effectiveDate;

    private Boolean submit;
}
