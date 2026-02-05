package com.hrsaas.employee.domain.dto.request;

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
public class UpdateCondolenceRequest {

    private LocalDate eventDate;

    private String description;

    @Size(max = 50, message = "관계는 50자 이하여야 합니다.")
    private String relation;

    @Size(max = 100, message = "관계인 이름은 100자 이하여야 합니다.")
    private String relatedPersonName;
}
