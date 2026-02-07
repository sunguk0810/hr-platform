package com.hrsaas.auth.service;

import java.util.UUID;

public interface PasswordHistoryService {

    void saveHistory(UUID userId, String passwordHash);

    boolean isRecentlyUsed(UUID userId, String newPassword, int historyCount);
}
