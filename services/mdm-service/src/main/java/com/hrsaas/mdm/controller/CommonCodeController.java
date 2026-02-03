package com.hrsaas.mdm.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.mdm.domain.dto.request.CreateCommonCodeRequest;
import com.hrsaas.mdm.domain.dto.response.CommonCodeResponse;
import com.hrsaas.mdm.service.CommonCodeService;
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
@RequestMapping("/api/v1/mdm/common-codes")
@RequiredArgsConstructor
@Tag(name = "Common Code", description = "공통 코드 관리 API")
public class CommonCodeController {

    private final CommonCodeService commonCodeService;

    @PostMapping
    @Operation(summary = "공통 코드 생성")
    public ResponseEntity<ApiResponse<CommonCodeResponse>> create(
            @Valid @RequestBody CreateCommonCodeRequest request) {
        CommonCodeResponse response = commonCodeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/group/{groupCode}")
    @Operation(summary = "그룹별 공통 코드 목록 조회")
    public ResponseEntity<ApiResponse<List<CommonCodeResponse>>> getByGroupCode(
            @PathVariable String groupCode) {
        List<CommonCodeResponse> response = commonCodeService.getByGroupCode(groupCode);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/group/{groupCode}/code/{code}")
    @Operation(summary = "특정 공통 코드 조회")
    public ResponseEntity<ApiResponse<CommonCodeResponse>> getByGroupAndCode(
            @PathVariable String groupCode,
            @PathVariable String code) {
        CommonCodeResponse response = commonCodeService.getByGroupAndCode(groupCode, code);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}/activate")
    @Operation(summary = "공통 코드 활성화")
    public ResponseEntity<ApiResponse<CommonCodeResponse>> activate(@PathVariable UUID id) {
        CommonCodeResponse response = commonCodeService.activate(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}/deactivate")
    @Operation(summary = "공통 코드 비활성화")
    public ResponseEntity<ApiResponse<CommonCodeResponse>> deactivate(@PathVariable UUID id) {
        CommonCodeResponse response = commonCodeService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "공통 코드 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        commonCodeService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "공통 코드가 삭제되었습니다."));
    }
}
