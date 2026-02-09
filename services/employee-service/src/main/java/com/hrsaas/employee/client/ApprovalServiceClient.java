package com.hrsaas.employee.client;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.employee.client.dto.ApprovalDocumentClientResponse;
import com.hrsaas.employee.client.dto.CreateApprovalClientRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.UUID;

@FeignClient(
    name = "approval-service",
    url = "${feign.client.approval-service.url:http://localhost:8086}",
    configuration = FeignClientConfig.class
)
public interface ApprovalServiceClient {

    @PostMapping("/api/v1/approvals")
    ApiResponse<ApprovalDocumentClientResponse> createApproval(
        @RequestBody CreateApprovalClientRequest request);

    @DeleteMapping("/api/v1/approvals/{id}")
    ApiResponse<Void> cancelApproval(@PathVariable("id") UUID id);
}
