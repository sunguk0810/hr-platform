package com.hrsaas.organization.domain.dto.request;

import com.hrsaas.organization.domain.entity.HeadcountRequestType;
import jakarta.validation.constraints.Min;
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
public class CreateHeadcountRequestRequest {

    @NotNull(message = "부서 ID를 입력해주세요.")
    private UUID departmentId;

    private String departmentName;

    @NotNull(message = "요청 유형을 입력해주세요.")
    private HeadcountRequestType type;

    @NotNull(message = "요청 인원을 입력해주세요.")
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
