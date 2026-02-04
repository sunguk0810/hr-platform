package com.hrsaas.mdm.domain.entity;

import com.hrsaas.common.entity.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * 코드 변경 이력 엔티티
 * 공통 코드의 모든 변경 사항을 추적합니다.
 */
@Entity
@Table(name = "code_history", schema = "tenant_common",
    indexes = {
        @Index(name = "idx_code_history_code_id", columnList = "code_id"),
        @Index(name = "idx_code_history_tenant_id", columnList = "tenant_id"),
        @Index(name = "idx_code_history_action", columnList = "action")
    })
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CodeHistory extends AuditableEntity {

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "code_id", nullable = false)
    private UUID codeId;

    @Column(name = "code_group_id", nullable = false)
    private UUID codeGroupId;

    @Column(name = "group_code", nullable = false, length = 50)
    private String groupCode;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 20)
    private CodeAction action;

    @Column(name = "field_name", length = 100)
    private String fieldName;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(name = "change_reason", length = 500)
    private String changeReason;

    @Column(name = "changed_by", length = 100)
    private String changedBy;

    @Column(name = "changed_by_id")
    private UUID changedById;

    @Builder
    public CodeHistory(UUID tenantId, UUID codeId, UUID codeGroupId, String groupCode,
                       String code, CodeAction action, String fieldName,
                       String oldValue, String newValue, String changeReason,
                       String changedBy, UUID changedById) {
        this.tenantId = tenantId;
        this.codeId = codeId;
        this.codeGroupId = codeGroupId;
        this.groupCode = groupCode;
        this.code = code;
        this.action = action;
        this.fieldName = fieldName;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.changeReason = changeReason;
        this.changedBy = changedBy;
        this.changedById = changedById;
    }

    /**
     * 생성 이력 생성
     */
    public static CodeHistory ofCreated(CommonCode code, String changedBy, UUID changedById) {
        return CodeHistory.builder()
            .tenantId(code.getTenantId())
            .codeId(code.getId())
            .codeGroupId(code.getCodeGroup().getId())
            .groupCode(code.getCodeGroup().getGroupCode())
            .code(code.getCode())
            .action(CodeAction.CREATED)
            .newValue(code.getCodeName())
            .changedBy(changedBy)
            .changedById(changedById)
            .build();
    }

    /**
     * 필드 변경 이력 생성
     */
    public static CodeHistory ofFieldChanged(CommonCode code, String fieldName,
                                              String oldValue, String newValue,
                                              String changedBy, UUID changedById) {
        return CodeHistory.builder()
            .tenantId(code.getTenantId())
            .codeId(code.getId())
            .codeGroupId(code.getCodeGroup().getId())
            .groupCode(code.getCodeGroup().getGroupCode())
            .code(code.getCode())
            .action(CodeAction.UPDATED)
            .fieldName(fieldName)
            .oldValue(oldValue)
            .newValue(newValue)
            .changedBy(changedBy)
            .changedById(changedById)
            .build();
    }

    /**
     * 상태 변경 이력 생성
     */
    public static CodeHistory ofStatusChanged(CommonCode code, CodeAction action,
                                               CodeStatus oldStatus, CodeStatus newStatus,
                                               String changedBy, UUID changedById) {
        return CodeHistory.builder()
            .tenantId(code.getTenantId())
            .codeId(code.getId())
            .codeGroupId(code.getCodeGroup().getId())
            .groupCode(code.getCodeGroup().getGroupCode())
            .code(code.getCode())
            .action(action)
            .fieldName("status")
            .oldValue(oldStatus != null ? oldStatus.name() : null)
            .newValue(newStatus.name())
            .changedBy(changedBy)
            .changedById(changedById)
            .build();
    }

    /**
     * 삭제 이력 생성
     */
    public static CodeHistory ofDeleted(CommonCode code, String changedBy, UUID changedById) {
        return CodeHistory.builder()
            .tenantId(code.getTenantId())
            .codeId(code.getId())
            .codeGroupId(code.getCodeGroup().getId())
            .groupCode(code.getCodeGroup().getGroupCode())
            .code(code.getCode())
            .action(CodeAction.DELETED)
            .oldValue(code.getCodeName())
            .changedBy(changedBy)
            .changedById(changedById)
            .build();
    }
}
