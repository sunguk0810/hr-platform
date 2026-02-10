package com.hrsaas.approval.domain.dto.response;

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
public class BatchApprovalResponse {

    private int totalRequested;
    private int successCount;
    private int failureCount;
    private List<BatchItemResult> results;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchItemResult {
        private UUID documentId;
        private boolean success;
        private String errorMessage;
    }
}
