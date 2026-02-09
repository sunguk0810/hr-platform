package com.hrsaas.employee.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevokeCardRequest {

    @NotBlank(message = "회수 사유를 입력해주세요.")
    private String reason;
}
