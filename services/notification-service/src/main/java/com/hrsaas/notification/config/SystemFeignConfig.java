package com.hrsaas.notification.config;

import com.hrsaas.notification.client.SystemTokenHolder;
import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Configuration
public class SystemFeignConfig {

    @Bean
    public RequestInterceptor requestInterceptor() {
        return new RequestInterceptor() {
            @Override
            public void apply(RequestTemplate template) {
                // Priority 1: System Token (for async/background tasks)
                String systemToken = SystemTokenHolder.getToken();
                if (systemToken != null) {
                    template.header("Authorization", "Bearer " + systemToken);
                    return;
                }

                // Priority 2: Current Request Token (for synchronous API calls)
                ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

                if (attributes != null) {
                    String authHeader = attributes.getRequest().getHeader("Authorization");
                    if (authHeader != null && !authHeader.isEmpty()) {
                        template.header("Authorization", authHeader);
                    }
                }
            }
        };
    }
}
