package com.hrsaas.mdm.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * 코드 엑스포트 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeExportResponse {

    private String exportVersion;
    private Instant exportedAt;
    private int totalGroups;
    private int totalCodes;
    private List<CodeGroupExportData> groups;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CodeGroupExportData {
        private String groupCode;
        private String groupName;
        private String description;
        private boolean system;
        private Integer sortOrder;
        private List<CodeExportData> codes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CodeExportData {
        private String code;
        private String codeName;
        private String codeNameEn;
        private String description;
        private String extraValue1;
        private String extraValue2;
        private String extraValue3;
        private Integer sortOrder;
    }
}
