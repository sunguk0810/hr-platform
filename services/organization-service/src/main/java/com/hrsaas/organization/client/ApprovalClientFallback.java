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
}
