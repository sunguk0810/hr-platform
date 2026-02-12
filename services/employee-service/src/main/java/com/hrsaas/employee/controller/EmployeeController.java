package com.hrsaas.employee.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.employee.domain.dto.request.CreateEmployeeRequest;
import com.hrsaas.employee.domain.dto.request.EmployeeSearchCondition;
import com.hrsaas.employee.domain.dto.request.UpdateEmployeeRequest;
import com.hrsaas.employee.domain.dto.response.BulkImportResultResponse;
import com.hrsaas.employee.domain.dto.response.EmployeeResponse;
import com.hrsaas.employee.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
@Tag(name = "Employee", description = "직원 관리 API")
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping("/me")
    @Operation(summary = "내 정보 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getMe() {
        UUID employeeId = SecurityContextHolder.getCurrentEmployeeId();
        if (employeeId == null) {
            throw new IllegalStateException("Employee ID not found in security context");
        }
        EmployeeResponse response = employeeService.getById(employeeId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "직원 생성")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> create(
            @Valid @RequestBody CreateEmployeeRequest request) {
        EmployeeResponse response = employeeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/search")
    @Operation(summary = "직원 키워드 검색 (이름/사번)")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<EmployeeResponse>>> searchByKeyword(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20) Pageable pageable) {
        PageResponse<EmployeeResponse> response = employeeService.searchByKeyword(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "직원 상세 조회")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN') and @permissionChecker.canAccessEmployee(#id)")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getById(@PathVariable UUID id) {
        EmployeeResponse response = employeeService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/employee-number/{employeeNumber}")
    @Operation(summary = "사번으로 직원 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getByEmployeeNumber(
            @PathVariable String employeeNumber) {
        EmployeeResponse response = employeeService.getByEmployeeNumber(employeeNumber);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "직원 검색")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<EmployeeResponse>>> search(
            @ModelAttribute EmployeeSearchCondition condition,
            @PageableDefault(size = 20) Pageable pageable) {
        PageResponse<EmployeeResponse> response = employeeService.search(condition, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "직원 정보 수정")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN') or @permissionChecker.isSelf(#id)")
    public ResponseEntity<ApiResponse<EmployeeResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateEmployeeRequest request) {
        EmployeeResponse response = employeeService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/resign")
    @Operation(summary = "직원 퇴사 처리")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> resign(
            @PathVariable UUID id,
            @RequestParam String resignDate) {
        EmployeeResponse response = employeeService.resign(id, resignDate);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/resign/cancel")
    @Operation(summary = "직원 퇴사 취소")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> cancelResign(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("reason", "");
        EmployeeResponse response = employeeService.cancelResign(id, reason);
        return ResponseEntity.ok(ApiResponse.success(response, "퇴사가 취소되었습니다."));
    }

    @PostMapping("/{id}/unmask")
    @Operation(summary = "개인정보 마스킹 해제")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> unmask(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String field = body.get("field");
        String reason = body.get("reason");
        String value = employeeService.unmask(id, field, reason);
        return ResponseEntity.ok(ApiResponse.success(Map.of("value", value)));
    }

    @GetMapping("/export")
    @Operation(summary = "직원 목록 엑셀 내보내기")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<byte[]> exportToExcel(@ModelAttribute EmployeeSearchCondition condition) {
        byte[] excelData = employeeService.exportToExcel(condition);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "employees.xlsx");
        return ResponseEntity.ok().headers(headers).body(excelData);
    }

    @PostMapping("/import")
    @Operation(summary = "직원 목록 엑셀 가져오기")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<BulkImportResultResponse>> importFromExcel(
            @RequestParam("file") MultipartFile file) {
        BulkImportResultResponse result = employeeService.importFromExcel(file);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/import/template")
    @Operation(summary = "직원 일괄등록 템플릿 다운로드")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<byte[]> getImportTemplate() {
        byte[] template = employeeService.getImportTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "employee_import_template.xlsx");
        return ResponseEntity.ok().headers(headers).body(template);
    }

    @PostMapping("/bulk-delete")
    @Operation(summary = "직원 일괄 삭제")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> bulkDelete(
            @RequestBody Map<String, List<String>> body) {
        List<UUID> ids = body.get("ids").stream().map(UUID::fromString).toList();
        int deleted = employeeService.bulkDelete(ids);
        return ResponseEntity.ok(ApiResponse.success(Map.of("deleted", deleted)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "직원 삭제 (소프트 삭제)")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        employeeService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "직원이 삭제되었습니다."));
    }

    @GetMapping("/count")
    @Operation(summary = "직원 수 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> count(
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) String positionCode,
            @RequestParam(required = false) String jobTitleCode) {
        Map<String, Long> counts = new java.util.HashMap<>();
        if (departmentId != null) {
            counts.put("departmentCount", employeeService.countByDepartment(departmentId));
        }
        if (positionCode != null) {
            counts.put("positionCount", employeeService.countByPosition(positionCode));
        }
        if (jobTitleCode != null) {
            counts.put("gradeCount", employeeService.countByGrade(jobTitleCode));
        }
        return ResponseEntity.ok(ApiResponse.success(counts));
    }

    @GetMapping("/{id}/exists")
    @Operation(summary = "직원 존재 여부 확인")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> exists(@PathVariable UUID id) {
        boolean exists = employeeService.existsById(id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("exists", exists)));
    }

    @PostMapping("/batch")
    @Operation(summary = "직원 정보 일괄 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getBatch(@RequestBody List<UUID> ids) {
        List<EmployeeResponse> responses = employeeService.getBatch(ids);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/list")
    @Operation(summary = "직원 목록 조회 (페이징 없음)")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getList(
            @ModelAttribute EmployeeSearchCondition condition) {
        List<EmployeeResponse> responses = employeeService.getList(condition);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}
