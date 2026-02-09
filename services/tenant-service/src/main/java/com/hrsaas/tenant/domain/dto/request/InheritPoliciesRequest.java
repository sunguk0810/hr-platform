package com.hrsaas.tenant.domain.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InheritPoliciesRequest {

    @NotEmpty(message = "자회사 ID 목록은 필수입니다.")
    private List<UUID> childIds;

    @NotEmpty(message = "정책 유형 목록은 필수입니다.")
    private List<String> policyTypes;
}
