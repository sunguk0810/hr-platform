package com.hrsaas.auth.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserStatusRequest {

    @NotBlank(message = "상태는 필수입니다.")
    @Pattern(regexp = "^(ACTIVE|INACTIVE)$", message = "상태는 ACTIVE 또는 INACTIVE만 가능합니다.")
    private String status;
}
