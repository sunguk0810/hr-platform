package com.hrsaas.tenant.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrandingDto {

    private String primaryColor;
    private String secondaryColor;
    private String logoUrl;
    private String faviconUrl;
    private String loginBackgroundUrl;
}
