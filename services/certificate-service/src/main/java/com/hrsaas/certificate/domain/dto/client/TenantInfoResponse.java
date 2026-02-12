package com.hrsaas.certificate.domain.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantInfoResponse {
    private UUID id;
    private String code;
    private String name;
}
