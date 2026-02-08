package com.hrsaas.organization.domain.dto.response;

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
public class OrgChartNodeResponse {

    private UUID id;
    private String code;
    private String name;
    private Integer level;
    private String status;
    private ManagerInfo manager;
    private Integer employeeCount;
    private List<OrgChartNodeResponse> children;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ManagerInfo {
        private UUID id;
        private String name;
        private String gradeName;
        private String positionName;
    }
}
