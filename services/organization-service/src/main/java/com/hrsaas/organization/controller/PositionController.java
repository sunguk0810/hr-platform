package com.hrsaas.organization.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.organization.domain.dto.request.CreatePositionRequest;
import com.hrsaas.organization.domain.dto.request.UpdatePositionRequest;
import com.hrsaas.organization.domain.dto.response.PositionResponse;
import com.hrsaas.organization.service.PositionService;
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
@RequestMapping("/api/v1/positions")
@RequiredArgsConstructor
@Tag(name = "Position", description = "직책 관리 API")
public class PositionController {

    private final PositionService positionService;

    @PostMapping
    @Operation(summary = "직책 생성")
    public ResponseEntity<ApiResponse<PositionResponse>> create(
            @Valid @RequestBody CreatePositionRequest request) {
        PositionResponse response = positionService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "직책 상세 조회")
    public ResponseEntity<ApiResponse<PositionResponse>> getById(@PathVariable UUID id) {
        PositionResponse response = positionService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "직책 코드로 조회")
    public ResponseEntity<ApiResponse<PositionResponse>> getByCode(@PathVariable String code) {
        PositionResponse response = positionService.getByCode(code);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "직책 목록 조회")
    public ResponseEntity<ApiResponse<List<PositionResponse>>> getAll(
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly) {
        List<PositionResponse> response = activeOnly ? positionService.getActive() : positionService.getAll();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "직책 수정")
    public ResponseEntity<ApiResponse<PositionResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePositionRequest request) {
        PositionResponse response = positionService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "직책 삭제 (비활성화)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        positionService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "직책이 삭제되었습니다."));
    }
}
