package com.hrsaas.auth.service;

import com.hrsaas.auth.domain.entity.UserEntity;
import com.hrsaas.auth.repository.UserRepository;
import com.hrsaas.auth.repository.UserSessionRepository;
import com.hrsaas.auth.service.impl.UserManagementServiceImpl;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserManagementServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserSessionRepository userSessionRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private SessionService sessionService;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private UserManagementServiceImpl userManagementService;

    @Test
    @DisplayName("Admin resets user password - success")
    void resetUserPassword_success() {
        UUID userId = UUID.fromString("10000000-0000-0000-0000-000000000001");
        UserEntity user = new UserEntity();
        user.setId(userId);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPasswordHash("oldhash");

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(anyString())).thenReturn("newhash");

        userManagementService.resetUserPassword(userId);

        verify(userRepository).save(user);
        verify(eventPublisher).publish(any());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Get users filters by tenant")
    void getUsers_filtersByTenant() {
        UUID tenantId = UUID.randomUUID();
        TenantContext.setCurrentTenant(tenantId);

        UserEntity user = new UserEntity();
        user.setId(UUID.randomUUID());
        user.setTenantId(tenantId);
        user.setUsername("testuser");
        user.setRoles(new String[]{"USER"});

        when(userRepository.findAllByTenantId(tenantId)).thenReturn(List.of(user));

        userManagementService.getUsers();

        verify(userRepository).findAllByTenantId(tenantId);
        verify(userRepository, never()).findAll();
    }

    @Test
    @DisplayName("Get users returns empty list when no tenant context")
    void getUsers_returnsEmptyList_whenNoTenantContext() {
        TenantContext.clear();

        List<com.hrsaas.auth.domain.dto.response.UserDetailResponse> result = userManagementService.getUsers();

        org.junit.jupiter.api.Assertions.assertTrue(result.isEmpty());
        verify(userRepository, never()).findAllByTenantId(any());
        verify(userRepository, never()).findAll();
    }
}
