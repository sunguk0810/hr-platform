package com.hrsaas.tenant.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettingsDto {

    private String locale;
    private String timezone;
    private String dateFormat;
    private String timeFormat;
    private String currency;
    private Integer fiscalYearStartMonth;
}
