package com.hrsaas.employee.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.employee.domain.dto.request.CreateEmployeeCareerRequest;
import com.hrsaas.employee.domain.dto.request.CreateEmployeeCertificateRequest;
import com.hrsaas.employee.domain.dto.request.CreateEmployeeEducationRequest;
import com.hrsaas.employee.domain.dto.response.EmployeeCareerResponse;
import com.hrsaas.employee.domain.dto.response.EmployeeCertificateResponse;
import com.hrsaas.employee.domain.dto.response.EmployeeEducationResponse;
import com.hrsaas.employee.service.EmployeeDetailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/employees/{employeeId}")
@RequiredArgsConstructor
@Tag(name = "Employee Detail", description = "직원 상세정보 (경력/학력/자격증) 관리 API")
public class EmployeeDetailController {

    private final EmployeeDetailService employeeDetailService;

    // Career APIs
    @PostMapping("/careers")
    @Operation(summary = "경력 정보 등록")
    public ResponseEntity<ApiResponse<EmployeeCareerResponse>> createCareer(
            @PathVariable UUID employeeId,
            @Valid @RequestBody CreateEmployeeCareerRequest request) {
        EmployeeCareerResponse response = employeeDetailService.createCareer(employeeId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/careers")
    @Operation(summary = "경력 정보 목록 조회")
    public ResponseEntity<ApiResponse<List<EmployeeCareerResponse>>> getCareers(
            @PathVariable UUID employeeId) {
        List<EmployeeCareerResponse> response = employeeDetailService.getCareers(employeeId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/careers/{careerId}")
    @Operation(summary = "경력 정보 삭제")
    public ResponseEntity<ApiResponse<Void>> deleteCareer(
            @PathVariable UUID employeeId,
            @PathVariable UUID careerId) {
        employeeDetailService.deleteCareer(employeeId, careerId);
        return ResponseEntity.ok(ApiResponse.success(null, "경력 정보가 삭제되었습니다."));
    }

    // Education APIs
    @PostMapping("/educations")
    @Operation(summary = "학력 정보 등록")
    public ResponseEntity<ApiResponse<EmployeeEducationResponse>> createEducation(
            @PathVariable UUID employeeId,
            @Valid @RequestBody CreateEmployeeEducationRequest request) {
        EmployeeEducationResponse response = employeeDetailService.createEducation(employeeId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/educations")
    @Operation(summary = "학력 정보 목록 조회")
    public ResponseEntity<ApiResponse<List<EmployeeEducationResponse>>> getEducations(
            @PathVariable UUID employeeId) {
        List<EmployeeEducationResponse> response = employeeDetailService.getEducations(employeeId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/educations/{educationId}")
    @Operation(summary = "학력 정보 삭제")
    public ResponseEntity<ApiResponse<Void>> deleteEducation(
            @PathVariable UUID employeeId,
            @PathVariable UUID educationId) {
        employeeDetailService.deleteEducation(employeeId, educationId);
        return ResponseEntity.ok(ApiResponse.success(null, "학력 정보가 삭제되었습니다."));
    }

    // Certificate APIs
    @PostMapping("/certificates")
    @Operation(summary = "자격증 정보 등록")
    public ResponseEntity<ApiResponse<EmployeeCertificateResponse>> createCertificate(
            @PathVariable UUID employeeId,
            @Valid @RequestBody CreateEmployeeCertificateRequest request) {
        EmployeeCertificateResponse response = employeeDetailService.createCertificate(employeeId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/certificates")
    @Operation(summary = "자격증 정보 목록 조회")
    public ResponseEntity<ApiResponse<List<EmployeeCertificateResponse>>> getCertificates(
            @PathVariable UUID employeeId,
            @RequestParam(required = false, defaultValue = "false") boolean validOnly) {
        List<EmployeeCertificateResponse> response = validOnly
            ? employeeDetailService.getValidCertificates(employeeId)
            : employeeDetailService.getCertificates(employeeId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/certificates/{certificateId}")
    @Operation(summary = "자격증 정보 삭제")
    public ResponseEntity<ApiResponse<Void>> deleteCertificate(
            @PathVariable UUID employeeId,
            @PathVariable UUID certificateId) {
        employeeDetailService.deleteCertificate(employeeId, certificateId);
        return ResponseEntity.ok(ApiResponse.success(null, "자격증 정보가 삭제되었습니다."));
    }
}
