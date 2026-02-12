package com.hrsaas.employee.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.employee.domain.dto.request.UpdateEmployeeRequest;
import com.hrsaas.employee.domain.dto.response.EmployeeResponse;
import com.hrsaas.employee.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
@Tag(name = "Profile", description = "내 프로필 API")
public class ProfileController {

    private final EmployeeService employeeService;
    private final Map<UUID, String> profileImageByEmployeeId = new ConcurrentHashMap<>();

    @GetMapping("/me")
    @Operation(summary = "내 프로필 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProfileResponse>> getMyProfile() {
        UUID employeeId = SecurityContextHolder.getCurrentEmployeeId();
        EmployeeResponse employee = employeeService.getById(employeeId);
        return ResponseEntity.ok(ApiResponse.success(ProfileResponse.from(employee, profileImageByEmployeeId.get(employeeId))));
    }

    @PutMapping("/me")
    @Operation(summary = "내 프로필 수정")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProfileResponse>> updateMyProfile(@RequestBody UpdateProfileRequest request) {
        UUID employeeId = SecurityContextHolder.getCurrentEmployeeId();
        UpdateEmployeeRequest updateRequest = UpdateEmployeeRequest.builder()
            .nameEn(request.getNameEn())
            .email(request.getEmail())
            .mobile(request.getMobile())
            .build();
        EmployeeResponse employee = employeeService.update(employeeId, updateRequest);
        return ResponseEntity.ok(ApiResponse.success(ProfileResponse.from(employee, profileImageByEmployeeId.get(employeeId))));
    }

    @PostMapping("/me/photo")
    @Operation(summary = "내 프로필 사진 업로드")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadPhoto(@RequestParam("file") MultipartFile file) {
        UUID employeeId = SecurityContextHolder.getCurrentEmployeeId();
        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "profile.jpg";
        String url = "/api/v1/profile/me/photo/" + employeeId;
        profileImageByEmployeeId.put(employeeId, url);
        return ResponseEntity.ok(ApiResponse.success(Map.of("url", url, "filename", fileName)));
    }

    @DeleteMapping("/me/photo")
    @Operation(summary = "내 프로필 사진 삭제")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deletePhoto() {
        UUID employeeId = SecurityContextHolder.getCurrentEmployeeId();
        profileImageByEmployeeId.remove(employeeId);
        return ResponseEntity.ok(ApiResponse.success(null, "프로필 사진이 삭제되었습니다."));
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    static class UpdateProfileRequest {
        private String email;
        private String mobile;
        private String nameEn;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    static class ProfileResponse {
        private UUID id;
        private String employeeNumber;
        private String name;
        private String nameEn;
        private String email;
        private String mobile;
        private java.time.LocalDate hireDate;
        private UUID departmentId;
        private String departmentName;
        private String positionName;
        private String gradeName;
        private String profileImageUrl;

        static ProfileResponse from(EmployeeResponse employee, String profileImageUrl) {
            return ProfileResponse.builder()
                .id(employee.getId())
                .employeeNumber(employee.getEmployeeNumber())
                .name(employee.getName())
                .nameEn(employee.getNameEn())
                .email(employee.getEmail())
                .mobile(employee.getMobile())
                .hireDate(employee.getHireDate())
                .departmentId(employee.getDepartmentId())
                .departmentName(employee.getDepartmentName())
                .positionName(employee.getPositionName())
                .gradeName(employee.getGradeName())
                .profileImageUrl(profileImageUrl)
                .build();
        }
    }
}
