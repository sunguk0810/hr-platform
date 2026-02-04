package com.hrsaas.tenant.domain.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.hrsaas.common.privacy.Masked;
import com.hrsaas.common.privacy.MaskType;
import com.hrsaas.common.privacy.serializer.MaskedFieldSerializer;
import com.hrsaas.tenant.domain.entity.PlanType;
import com.hrsaas.tenant.domain.entity.Tenant;
import com.hrsaas.tenant.domain.entity.TenantStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantResponse {

    private UUID id;
    private String code;
    private String name;

    @Masked(type = MaskType.GENERIC, visibleChars = 3)
    @JsonSerialize(using = MaskedFieldSerializer.class)
    private String businessNumber;

    private String representativeName;

    @Masked(type = MaskType.ADDRESS)
    @JsonSerialize(using = MaskedFieldSerializer.class)
    private String address;

    @Masked(type = MaskType.PHONE)
    @JsonSerialize(using = MaskedFieldSerializer.class)
    private String phone;

    @Masked(type = MaskType.EMAIL)
    @JsonSerialize(using = MaskedFieldSerializer.class)
    private String email;
    private TenantStatus status;
    private PlanType planType;
    private LocalDate contractStartDate;
    private LocalDate contractEndDate;
    private Integer maxEmployees;
    private Instant createdAt;
    private Instant updatedAt;

    public static TenantResponse from(Tenant tenant) {
        return TenantResponse.builder()
            .id(tenant.getId())
            .code(tenant.getCode())
            .name(tenant.getName())
            .businessNumber(tenant.getBusinessNumber())
            .representativeName(tenant.getRepresentativeName())
            .address(tenant.getAddress())
            .phone(tenant.getPhone())
            .email(tenant.getEmail())
            .status(tenant.getStatus())
            .planType(tenant.getPlanType())
            .contractStartDate(tenant.getContractStartDate())
            .contractEndDate(tenant.getContractEndDate())
            .maxEmployees(tenant.getMaxEmployees())
            .createdAt(tenant.getCreatedAt())
            .updatedAt(tenant.getUpdatedAt())
            .build();
    }
}
