package com.hrsaas.tenant.client;

import com.hrsaas.common.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "attendance-service", url = "${feign.client.attendance-service.url:http://localhost:8085}",
             configuration = FeignClientConfig.class)
public interface AttendanceServiceClient {

    @GetMapping("/api/v1/leaves/count/pending")
    ApiResponse<Long> getPendingLeaveCount(@RequestHeader("X-Tenant-ID") String tenantId);
}
