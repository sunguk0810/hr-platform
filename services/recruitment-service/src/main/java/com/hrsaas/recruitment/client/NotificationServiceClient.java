package com.hrsaas.recruitment.client;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.recruitment.client.dto.NotificationResponse;
import com.hrsaas.recruitment.client.dto.SendNotificationRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@FeignClient(
    name = "notification-service",
    url = "${feign.client.notification-service.url:http://localhost:8088}"
)
public interface NotificationServiceClient {

    @PostMapping("/api/v1/notifications")
    ApiResponse<List<NotificationResponse>> send(@RequestBody SendNotificationRequest request);
}
