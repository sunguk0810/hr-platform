package com.hrsaas.tenant.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeatureDto {

    private String code;
    private Boolean enabled;
    private Object config;
}
