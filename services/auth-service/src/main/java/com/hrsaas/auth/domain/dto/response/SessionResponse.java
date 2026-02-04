package com.hrsaas.auth.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionResponse {

    private String sessionId;
    private String deviceInfo;
    private String ipAddress;
    private String location;
    private LocalDateTime createdAt;
    private LocalDateTime lastAccessedAt;
    private boolean currentSession;
}
