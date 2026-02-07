package com.hrsaas.auth.service;

import java.util.UUID;

public interface LoginHistoryService {

    void recordSuccess(String userId, UUID tenantId, String ipAddress, String userAgent);

    void recordFailure(String userId, UUID tenantId, String ipAddress, String userAgent, String failureReason);
}
