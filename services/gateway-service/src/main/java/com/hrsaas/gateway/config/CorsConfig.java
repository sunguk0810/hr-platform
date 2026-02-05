package com.hrsaas.gateway.config;

// CORS는 application-aws.yml의 globalcors 설정으로 처리됨
// Spring Security의 CORS는 SecurityConfig에서 비활성화됨

import org.springframework.context.annotation.Configuration;

@Configuration
public class CorsConfig {
    // YAML globalcors + add-to-simple-url-handler-mapping: true 로 처리
}
