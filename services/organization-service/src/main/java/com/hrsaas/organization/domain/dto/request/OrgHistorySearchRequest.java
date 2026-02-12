package com.hrsaas.organization.domain.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Schema(description = "조직 변경 이력 검색 조건")
public class OrgHistorySearchRequest {

    @Schema(description = "부서 ID")
    private UUID departmentId;

    @Schema(description = "이벤트 유형")
    private String eventType;

    @Schema(description = "검색 시작일 (YYYY-MM-DD)")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate startDate;

    @Schema(description = "검색 종료일 (YYYY-MM-DD)")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate endDate;
}
