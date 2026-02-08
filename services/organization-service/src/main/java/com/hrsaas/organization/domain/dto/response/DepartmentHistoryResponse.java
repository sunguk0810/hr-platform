package com.hrsaas.organization.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * 조직 변경 이력 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentHistoryResponse {

    private UUID id;
    private String type;
    private Instant date;
    private String title;
    private String description;
    private ActorInfo actor;
    private UUID departmentId;
    private String departmentName;
    private String previousValue;
    private String newValue;
    private Map<String, Object> metadata;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActorInfo {
        private UUID id;
        private String name;
    }

    /**
     * 이력 이벤트 유형
     */
    public enum EventType {
        DEPARTMENT_CREATED,
        DEPARTMENT_UPDATED,
        DEPARTMENT_DELETED,
        DEPARTMENT_RENAMED,
        DEPARTMENT_MOVED,
        DEPARTMENT_MERGED,
        DEPARTMENT_SPLIT,
        DEPARTMENT_ACTIVATED,
        DEPARTMENT_DEACTIVATED,
        EMPLOYEE_JOINED,
        EMPLOYEE_LEFT,
        EMPLOYEE_TRANSFERRED
    }
}
