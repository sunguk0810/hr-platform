package com.hrsaas.tenant.client;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.tenant.client.dto.OrgSummaryDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "organization-service", url = "${feign.client.organization-service.url:http://localhost:8083}",
             configuration = FeignClientConfig.class)
public interface OrganizationServiceClient {

    @GetMapping("/api/v1/organizations/summary")
    ApiResponse<OrgSummaryDto> getOrgSummary();
}
