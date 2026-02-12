package com.hrsaas.tenant.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.hrsaas.common.security.SecurityFilter;
import com.hrsaas.common.security.jwt.JwtTokenProvider;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;

    @Bean
    public SecurityFilter securityFilter() {
        return new SecurityFilter(jwtTokenProvider);
    }

    @Bean
    public FilterRegistrationBean<SecurityFilter> securityFilterRegistration(SecurityFilter securityFilter) {
        FilterRegistrationBean<SecurityFilter> registration = new FilterRegistrationBean<>(securityFilter);
        registration.setEnabled(false); // Prevent automatic servlet filter registration
        return registration;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, SecurityFilter securityFilter) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .securityContext(context -> context
                .requireExplicitSave(true))
            .authorizeHttpRequests(auth -> auth
                // [보안 패치 적용] Actuator 접근 제어 강화
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/actuator/**").hasAnyRole("SYSTEM_ADMIN", "SUPER_ADMIN")

                // Swagger 및 문서
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()

                // Tenant API (기존 경로들)
                .requestMatchers("/api/v1/tenants/*/status").permitAll()
                .requestMatchers("/api/v1/tenants/*/password-policy").permitAll()
                .requestMatchers("/api/v1/tenants/*/basic").permitAll()

                // [Master 내용 유지] 새로 추가된 경로 포함
                .requestMatchers("/api/v1/tenants/code/*").permitAll()

                .anyRequest().authenticated()
            )
            .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}