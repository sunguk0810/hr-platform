package com.hrsaas.auth.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private long expiresIn;
    private long refreshExpiresIn;
    private boolean passwordExpired;
    private Integer passwordExpiresInDays;
    private boolean mfaRequired;
    private String tenantId;
    private String tenantCode;
    private String tenantName;
}
