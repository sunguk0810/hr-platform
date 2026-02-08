package com.hrsaas.tenant.domain.dto.request;

import com.hrsaas.tenant.domain.entity.PlanType;
import com.hrsaas.tenant.domain.entity.TenantStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantSearchRequest {

    private String keyword;
    private TenantStatus status;
    private PlanType planType;
    private LocalDate contractEndDateFrom;
    private LocalDate contractEndDateTo;
}
