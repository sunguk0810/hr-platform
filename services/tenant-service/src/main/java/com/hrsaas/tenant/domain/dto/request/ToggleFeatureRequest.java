package com.hrsaas.tenant.domain.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToggleFeatureRequest {

    private Boolean enabled;
    private Map<String, Object> config;
}
