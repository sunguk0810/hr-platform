package com.hrsaas.tenant.client;

import com.hrsaas.common.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "approval-service", url = "${feign.client.approval-service.url:http://localhost:8086}",
             configuration = FeignClientConfig.class)
public interface ApprovalServiceClient {

    @GetMapping("/api/v1/approvals/count/pending")
    ApiResponse<Long> getPendingApprovalCount(@RequestHeader("X-Tenant-ID") String tenantId);

    @GetMapping("/api/v1/approvals/statistics")
    ApiResponse<com.hrsaas.tenant.client.dto.ApprovalStatisticsDto> getStatistics();
}
