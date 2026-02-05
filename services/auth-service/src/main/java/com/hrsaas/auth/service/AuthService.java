package com.hrsaas.auth.service;

import com.hrsaas.auth.domain.dto.request.LoginRequest;
import com.hrsaas.auth.domain.dto.request.RefreshTokenRequest;
import com.hrsaas.auth.domain.dto.response.TokenResponse;
import com.hrsaas.auth.domain.dto.response.UserResponse;

public interface AuthService {

    TokenResponse login(LoginRequest request);

    TokenResponse refreshToken(RefreshTokenRequest request);

    void logout(String authorization);

    UserResponse getCurrentUser();
}
