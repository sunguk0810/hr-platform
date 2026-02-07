package com.hrsaas.auth.domain.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserRequest {

    @NotBlank(message = "사용자명은 필수입니다.")
    @Size(min = 3, max = 100, message = "사용자명은 3~100자여야 합니다.")
    private String username;

    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;

    @NotBlank(message = "비밀번호는 필수입니다.")
    @Size(min = 8, max = 100, message = "비밀번호는 8~100자여야 합니다.")
    private String password;

    @NotNull(message = "테넌트 ID는 필수입니다.")
    private UUID tenantId;

    private UUID employeeId;

    private List<String> roles;
}
