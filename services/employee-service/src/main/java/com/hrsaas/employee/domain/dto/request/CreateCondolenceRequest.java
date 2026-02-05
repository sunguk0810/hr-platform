package com.hrsaas.employee.domain.dto.request;

import com.hrsaas.employee.domain.entity.CondolenceEventType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class CreateCondolenceRequest {

    @NotNull(message = "경조사 유형을 선택해주세요.")
    private CondolenceEventType eventType;

    @NotNull(message = "경조사 일자를 입력해주세요.")
    private LocalDate eventDate;

    private String description;

    @Size(max = 50, message = "관계는 50자 이하여야 합니다.")
    private String relation;

    @Size(max = 100, message = "관계인 이름은 100자 이하여야 합니다.")
    private String relatedPersonName;

    private UUID policyId;
}
