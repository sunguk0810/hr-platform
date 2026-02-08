package com.hrsaas.tenant.client;

import feign.RequestInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Configuration
public class FeignClientConfig {

    @Bean
    public RequestInterceptor authorizationInterceptor() {
        return requestTemplate -> {
            ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String authorization = request.getHeader("Authorization");
                if (authorization != null) {
                    requestTemplate.header("Authorization", authorization);
                }
                String tenantId = request.getHeader("X-Tenant-ID");
                if (tenantId != null) {
                    requestTemplate.header("X-Tenant-ID", tenantId);
                }
            }
        };
    }
}
