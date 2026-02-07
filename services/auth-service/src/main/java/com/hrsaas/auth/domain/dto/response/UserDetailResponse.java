package com.hrsaas.auth.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDetailResponse {

    private String id;
    private String tenantId;
    private String employeeId;
    private String username;
    private String email;
    private List<String> roles;
    private List<String> permissions;
    private String status;
    private int failedLoginAttempts;
    private boolean locked;
    private OffsetDateTime lastLoginAt;
    private OffsetDateTime passwordChangedAt;
    private OffsetDateTime createdAt;
    private long activeSessionCount;
}
