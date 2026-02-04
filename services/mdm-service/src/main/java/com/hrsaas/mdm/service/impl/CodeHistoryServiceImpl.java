package com.hrsaas.mdm.service.impl;

import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.mdm.domain.dto.response.CodeHistoryResponse;
import com.hrsaas.mdm.domain.entity.CodeAction;
import com.hrsaas.mdm.domain.entity.CodeHistory;
import com.hrsaas.mdm.domain.entity.CodeStatus;
import com.hrsaas.mdm.domain.entity.CommonCode;
import com.hrsaas.mdm.repository.CodeHistoryRepository;
import com.hrsaas.mdm.service.CodeHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CodeHistoryServiceImpl implements CodeHistoryService {

    private final CodeHistoryRepository codeHistoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CodeHistoryResponse> getByCodeId(UUID codeId) {
        List<CodeHistory> histories = codeHistoryRepository.findByCodeId(codeId);
        return histories.stream()
            .map(CodeHistoryResponse::from)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CodeHistoryResponse> getByCodeId(UUID codeId, Pageable pageable) {
        return codeHistoryRepository.findByCodeId(codeId, pageable)
            .map(CodeHistoryResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CodeHistoryResponse> getByGroupCode(String groupCode) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<CodeHistory> histories = codeHistoryRepository.findByTenantIdAndGroupCode(tenantId, groupCode);
        return histories.stream()
            .map(CodeHistoryResponse::from)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CodeHistoryResponse> getByDateRange(Instant startDate, Instant endDate, Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return codeHistoryRepository.findByTenantIdAndDateRange(tenantId, startDate, endDate, pageable)
            .map(CodeHistoryResponse::from);
    }

    @Override
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordCreated(CommonCode code) {
        String[] userInfo = getCurrentUserInfo();
        CodeHistory history = CodeHistory.ofCreated(code, userInfo[0], parseUUID(userInfo[1]));
        codeHistoryRepository.save(history);
        log.debug("Code creation history recorded: codeId={}", code.getId());
    }

    @Override
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFieldChanged(CommonCode code, String fieldName, String oldValue, String newValue) {
        if (oldValue == null && newValue == null) {
            return;
        }
        if (oldValue != null && oldValue.equals(newValue)) {
            return;
        }

        String[] userInfo = getCurrentUserInfo();
        CodeHistory history = CodeHistory.ofFieldChanged(
            code, fieldName, oldValue, newValue, userInfo[0], parseUUID(userInfo[1]));
        codeHistoryRepository.save(history);
        log.debug("Code field change history recorded: codeId={}, field={}", code.getId(), fieldName);
    }

    @Override
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordStatusChanged(CommonCode code, CodeAction action, CodeStatus oldStatus, CodeStatus newStatus) {
        String[] userInfo = getCurrentUserInfo();
        CodeHistory history = CodeHistory.ofStatusChanged(
            code, action, oldStatus, newStatus, userInfo[0], parseUUID(userInfo[1]));
        codeHistoryRepository.save(history);
        log.debug("Code status change history recorded: codeId={}, action={}", code.getId(), action);
    }

    @Override
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordDeleted(CommonCode code) {
        String[] userInfo = getCurrentUserInfo();
        CodeHistory history = CodeHistory.ofDeleted(code, userInfo[0], parseUUID(userInfo[1]));
        codeHistoryRepository.save(history);
        log.debug("Code deletion history recorded: codeId={}", code.getId());
    }

    private String[] getCurrentUserInfo() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
                String name = jwt.getClaimAsString("name");
                String userId = jwt.getSubject();
                return new String[]{name != null ? name : "Unknown", userId};
            }
        } catch (Exception e) {
            log.warn("Failed to get current user info: {}", e.getMessage());
        }
        return new String[]{"System", null};
    }

    private UUID parseUUID(String uuidStr) {
        if (uuidStr == null || uuidStr.isEmpty()) {
            return null;
        }
        try {
            return UUID.fromString(uuidStr);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
