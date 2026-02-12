package com.hrsaas.organization.client;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.organization.client.dto.ApprovalResponse;
import com.hrsaas.organization.client.dto.CreateApprovalRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
public class ApprovalClientFallback implements ApprovalClient {

    @Override
    public ApiResponse<ApprovalResponse> createApproval(CreateApprovalRequest request) {
        log.error("ApprovalClient fallback: createApproval - operation blocked");
        throw new RuntimeException("Approval service unavailable: approval creation blocked");
    }

    @Override
    public ApiResponse<Void> cancelApproval(UUID id) {
        log.error("ApprovalClient fallback: cancelApproval - operation blocked");
        throw new RuntimeException("Approval service unavailable: approval cancellation blocked");
    }

    @Override
    public ApiResponse<java.util.Map<UUID, Long>> getDepartmentApprovalCounts(java.util.List<UUID> departmentIds) {
        log.error("ApprovalClient fallback: getDepartmentApprovalCounts - operation blocked");
        // Returning empty map or throwing exception? Since this is for analysis,
        // throwing exception might block the reorg plan.
        // But if we can't check approvals, we might miss critical info.
        // Let's return empty map but log error, so the analysis can proceed with a warning (which we can add in the caller if the call fails).
        // However, the interface returns ApiResponse.
        // For consistency with other methods, let's throw exception.
        throw new RuntimeException("Approval service unavailable: cannot check active approvals");
    }
}
