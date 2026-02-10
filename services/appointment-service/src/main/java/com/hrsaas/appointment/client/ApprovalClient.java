package com.hrsaas.appointment.client;

import com.hrsaas.common.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.UUID;

@FeignClient(
    name = "approval-service",
    url = "${feign.client.approval-service.url:http://localhost:8086}"
)
public interface ApprovalClient {

    @PostMapping("/api/v1/approvals")
    ApiResponse<ApprovalResponse> create(@RequestBody CreateApprovalRequest request);

    record CreateApprovalRequest(
        String title,
        String content,
        String documentType,
        String referenceType,
        UUID referenceId,
        List<ApprovalLineRequest> approvalLines,
        boolean submitImmediately
    ) {}

    record ApprovalLineRequest(
        UUID approverId,
        String approverName,
        String approverPosition,
        String approverDepartmentName,
        String lineType
    ) {}

    record ApprovalResponse(
        UUID id,
        String documentNumber,
        String status
    ) {}
}
