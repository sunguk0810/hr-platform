package com.hrsaas.auth.service;

import com.hrsaas.auth.domain.dto.request.ChangePasswordRequest;
import com.hrsaas.auth.domain.dto.request.ResetPasswordConfirmRequest;
import com.hrsaas.auth.domain.dto.request.ResetPasswordRequest;

public interface PasswordService {

    /**
     * Changes the password for the authenticated user.
     *
     * @param userId  The user ID
     * @param request The change password request
     */
    void changePassword(String userId, ChangePasswordRequest request);

    /**
     * Initiates a password reset by sending a reset link to the user's email.
     *
     * @param request The reset password request
     */
    void requestPasswordReset(ResetPasswordRequest request);

    /**
     * Confirms the password reset using the token.
     *
     * @param request The reset password confirm request
     */
    void confirmPasswordReset(ResetPasswordConfirmRequest request);
}
