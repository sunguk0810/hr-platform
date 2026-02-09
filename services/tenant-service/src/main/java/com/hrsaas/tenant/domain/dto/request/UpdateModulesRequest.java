package com.hrsaas.tenant.domain.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateModulesRequest {

    @NotNull(message = "모듈 목록은 필수입니다.")
    private List<String> modules;
}
