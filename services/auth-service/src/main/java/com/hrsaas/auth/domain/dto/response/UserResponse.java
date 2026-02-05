package com.hrsaas.auth.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * 현재 사용자 정보 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private String id;
    private String employeeId;
    private String employeeNumber;
    private String name;
    private String email;
    private String departmentId;
    private String departmentName;
    private String positionName;
    private String gradeName;
    private String profileImageUrl;
    private List<String> roles;
    private List<String> permissions;
}
