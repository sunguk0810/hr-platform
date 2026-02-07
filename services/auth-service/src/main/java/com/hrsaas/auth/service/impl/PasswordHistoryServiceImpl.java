package com.hrsaas.auth.service.impl;

import com.hrsaas.auth.domain.entity.PasswordHistory;
import com.hrsaas.auth.repository.PasswordHistoryRepository;
import com.hrsaas.auth.service.PasswordHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordHistoryServiceImpl implements PasswordHistoryService {

    private final PasswordHistoryRepository passwordHistoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void saveHistory(UUID userId, String passwordHash) {
        PasswordHistory history = PasswordHistory.builder()
                .userId(userId)
                .passwordHash(passwordHash)
                .build();
        passwordHistoryRepository.save(history);
        log.debug("Password history saved for user: {}", userId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isRecentlyUsed(UUID userId, String newPassword, int historyCount) {
        List<PasswordHistory> recentPasswords = passwordHistoryRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, historyCount));

        return recentPasswords.stream()
                .anyMatch(history -> passwordEncoder.matches(newPassword, history.getPasswordHash()));
    }
}
