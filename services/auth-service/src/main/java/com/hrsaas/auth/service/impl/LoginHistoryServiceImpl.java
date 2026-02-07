package com.hrsaas.auth.service.impl;

import com.hrsaas.auth.domain.entity.LoginHistory;
import com.hrsaas.auth.repository.LoginHistoryRepository;
import com.hrsaas.auth.service.LoginHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoginHistoryServiceImpl implements LoginHistoryService {

    private final LoginHistoryRepository loginHistoryRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordSuccess(String userId, UUID tenantId, String ipAddress, String userAgent) {
        try {
            LoginHistory history = LoginHistory.builder()
                    .userId(userId)
                    .tenantId(tenantId)
                    .status("SUCCESS")
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build();
            loginHistoryRepository.save(history);
            log.debug("Login success recorded for user: {}", userId);
        } catch (Exception e) {
            log.warn("Failed to record login success for user: {}", userId, e);
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailure(String userId, UUID tenantId, String ipAddress, String userAgent, String failureReason) {
        try {
            LoginHistory history = LoginHistory.builder()
                    .userId(userId)
                    .tenantId(tenantId)
                    .status("FAILURE")
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .failureReason(failureReason)
                    .build();
            loginHistoryRepository.save(history);
            log.debug("Login failure recorded for user: {}", userId);
        } catch (Exception e) {
            log.warn("Failed to record login failure for user: {}", userId, e);
        }
    }
}
