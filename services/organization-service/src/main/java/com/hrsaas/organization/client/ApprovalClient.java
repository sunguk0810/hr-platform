package com.hrsaas.organization.client;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.organization.client.dto.ApprovalResponse;
import com.hrsaas.organization.client.dto.CreateApprovalRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@FeignClient(
    name = "approval-service",
    url = "${services.approval-service.url:http://localhost:8086}",
    fallback = ApprovalClientFallback.class
)
public interface ApprovalClient {

    @PostMapping("/api/v1/approvals")
    ApiResponse<ApprovalResponse> createApproval(@RequestBody CreateApprovalRequest request);

    @DeleteMapping("/api/v1/approvals/{id}")
    ApiResponse<Void> cancelApproval(@PathVariable("id") UUID id);
}
