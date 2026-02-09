package com.hrsaas.tenant.domain.dto.response;

import com.hrsaas.tenant.domain.entity.TenantStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantTreeNodeResponse {

    private UUID id;
    private String code;
    private String name;
    private TenantStatus status;
    private Integer employeeCount;
    private Integer level;

    @Builder.Default
    private List<TenantTreeNodeResponse> children = new ArrayList<>();
}
