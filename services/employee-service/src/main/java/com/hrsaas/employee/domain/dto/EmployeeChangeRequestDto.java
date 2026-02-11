package com.hrsaas.employee.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for creating an employee change request.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "본인 정보 변경 요청 DTO")
public class EmployeeChangeRequestDto {

    @Schema(description = "변경할 필드명 (phone, mobile, email, nameEn, address, emergencyContact, emergencyPhone 등)", example = "mobile")
    private String fieldName;

    @Schema(description = "기존 값", example = "010-1234-5678")
    private String oldValue;

    @Schema(description = "새 값", example = "010-9876-5432")
    private String newValue;

    @Schema(description = "변경 사유", example = "휴대폰 번호 변경")
    private String reason;

    @Schema(description = "첨부 파일 ID 목록 (파일 서비스에서 업로드한 파일 ID)", example = "[\"550e8400-e29b-41d4-a716-446655440000\"]")
    private List<String> attachmentFileIds;
}
