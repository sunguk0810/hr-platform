package com.hrsaas.auth.service;

import com.hrsaas.auth.domain.dto.request.CreateUserRequest;
import com.hrsaas.auth.domain.dto.request.UpdateUserRolesRequest;
import com.hrsaas.auth.domain.dto.request.UpdateUserStatusRequest;
import com.hrsaas.auth.domain.dto.response.UserDetailResponse;

import java.util.List;
import java.util.UUID;

public interface UserManagementService {

    UserDetailResponse createUser(CreateUserRequest request);

    List<UserDetailResponse> getUsers();

    UserDetailResponse getUser(UUID userId);

    void updateStatus(UUID userId, UpdateUserStatusRequest request);

    void updateRoles(UUID userId, UpdateUserRolesRequest request);

    void unlockUser(UUID userId);

    void resetUserPassword(UUID userId);
}
