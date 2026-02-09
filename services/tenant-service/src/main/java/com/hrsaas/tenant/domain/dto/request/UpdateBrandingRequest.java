package com.hrsaas.tenant.domain.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBrandingRequest {

    private String primaryColor;
    private String secondaryColor;
    private String logoUrl;
    private String faviconUrl;
    private String loginBackgroundUrl;
}
