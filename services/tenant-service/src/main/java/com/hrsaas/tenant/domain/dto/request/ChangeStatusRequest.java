package com.hrsaas.tenant.domain.dto.request;

import com.hrsaas.tenant.domain.entity.TenantStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangeStatusRequest {

    @NotNull(message = "변경할 상태를 입력해주세요.")
    private TenantStatus status;
}
