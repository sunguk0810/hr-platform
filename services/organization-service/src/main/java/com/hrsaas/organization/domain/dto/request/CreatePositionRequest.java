package com.hrsaas.organization.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePositionRequest {

    @NotBlank(message = "직책 코드는 필수입니다")
    @Size(max = 50, message = "직책 코드는 50자를 초과할 수 없습니다")
    private String code;

    @NotBlank(message = "직책명은 필수입니다")
    @Size(max = 100, message = "직책명은 100자를 초과할 수 없습니다")
    private String name;

    @Size(max = 100, message = "영문 직책명은 100자를 초과할 수 없습니다")
    private String nameEn;

    @NotNull(message = "직책 레벨은 필수입니다")
    private Integer level;

    private Integer sortOrder;
}
