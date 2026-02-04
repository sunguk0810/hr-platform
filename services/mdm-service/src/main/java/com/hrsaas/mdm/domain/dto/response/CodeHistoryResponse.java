package com.hrsaas.mdm.domain.dto.response;

import com.hrsaas.mdm.domain.entity.CodeAction;
import com.hrsaas.mdm.domain.entity.CodeHistory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeHistoryResponse {

    private UUID id;
    private UUID codeId;
    private String groupCode;
    private String code;
    private CodeAction action;
    private String fieldName;
    private String oldValue;
    private String newValue;
    private String changeReason;
    private String changedBy;
    private UUID changedById;
    private Instant changedAt;

    public static CodeHistoryResponse from(CodeHistory history) {
        return CodeHistoryResponse.builder()
            .id(history.getId())
            .codeId(history.getCodeId())
            .groupCode(history.getGroupCode())
            .code(history.getCode())
            .action(history.getAction())
            .fieldName(history.getFieldName())
            .oldValue(history.getOldValue())
            .newValue(history.getNewValue())
            .changeReason(history.getChangeReason())
            .changedBy(history.getChangedBy())
            .changedById(history.getChangedById())
            .changedAt(history.getCreatedAt())
            .build();
    }
}
