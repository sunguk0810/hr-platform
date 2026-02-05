package com.hrsaas.employee.client;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Feign Client Configuration for inter-service communication
 * Propagates authentication and tenant headers to downstream services
 */
@Configuration
public class FeignClientConfig {

    @Bean
    public RequestInterceptor authenticationRequestInterceptor() {
        return new RequestInterceptor() {
            @Override
            public void apply(RequestTemplate template) {
                // Propagate Authorization header
                ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

                if (attributes != null) {
                    String authHeader = attributes.getRequest().getHeader("Authorization");
                    if (authHeader != null && !authHeader.isEmpty()) {
                        template.header("Authorization", authHeader);
                    }
                }

                // Alternative: Get token from SecurityContext if available
                if (!template.headers().containsKey("Authorization")) {
                    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                    if (authentication != null && authentication.getCredentials() instanceof Jwt jwt) {
                        template.header("Authorization", "Bearer " + jwt.getTokenValue());
                    }
                }

                // Propagate X-User-ID header if not explicitly set
                if (!template.headers().containsKey("X-User-ID") && attributes != null) {
                    String userId = attributes.getRequest().getHeader("X-User-ID");
                    if (userId != null && !userId.isEmpty()) {
                        template.header("X-User-ID", userId);
                    }
                }
            }
        };
    }
}
