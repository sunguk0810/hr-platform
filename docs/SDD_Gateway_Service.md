# Gateway Service - Software Design Document (SDD)

**문서 버전**: 1.0  
**작성일**: 2025-02-03  
**서비스명**: gateway-service  
**포트**: 8080  

---

## 목차

1. [서비스 개요](#1-서비스-개요)
2. [아키텍처](#2-아키텍처)
3. [라우팅 설정](#3-라우팅-설정)
4. [인증/인가](#4-인증인가)
5. [Rate Limiting](#5-rate-limiting)
6. [필터 체인](#6-필터-체인)
7. [Circuit Breaker](#7-circuit-breaker)
8. [API 명세](#8-api-명세)
9. [설정](#9-설정)
10. [모니터링](#10-모니터링)

---

## 1. 서비스 개요

### 1.1 목적

Gateway Service는 모든 클라이언트 요청의 단일 진입점(Single Entry Point)으로서 다음 기능을 수행합니다:

- **라우팅**: 요청을 적절한 마이크로서비스로 전달
- **인증/인가**: Keycloak 토큰 검증 및 권한 확인
- **Rate Limiting**: API 호출 횟수 제한
- **로드 밸런싱**: 서비스 인스턴스 간 부하 분산
- **Circuit Breaker**: 장애 전파 방지
- **요청/응답 변환**: 헤더 추가, 경로 재작성

### 1.2 기술 스택

| 구분 | 기술 |
|------|------|
| Framework | Spring Cloud Gateway 4.x |
| Runtime | Java 17 + Spring Boot 3.2 |
| 서비스 디스커버리 | Kubernetes Service Discovery |
| Rate Limiting | Redis + Spring Cloud Gateway |
| Circuit Breaker | Resilience4j |
| 인증 | Spring Security OAuth2 Resource Server |

### 1.3 의존성

```gradle
dependencies {
    implementation 'org.springframework.cloud:spring-cloud-starter-gateway'
    implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server'
    implementation 'org.springframework.boot:spring-boot-starter-data-redis-reactive'
    implementation 'org.springframework.cloud:spring-cloud-starter-circuitbreaker-reactor-resilience4j'
    implementation 'io.micrometer:micrometer-tracing-bridge-otel'
    implementation 'io.opentelemetry:opentelemetry-exporter-otlp'
}
```

---

## 2. 아키텍처

### 2.1 컴포넌트 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Gateway Service                                   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         Filter Chain                                     ││
│  │                                                                          ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     ││
│  │  │  CORS    │→│  Rate    │→│  Auth    │→│ Tenant   │→│  Logging │     ││
│  │  │  Filter  │ │ Limiter  │ │  Filter  │ │  Filter  │ │  Filter  │     ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘     ││
│  │                              │                                           ││
│  └──────────────────────────────│───────────────────────────────────────────┘│
│                                 │                                            │
│  ┌──────────────────────────────▼───────────────────────────────────────────┐│
│  │                        Route Predicates                                  ││
│  │                                                                          ││
│  │  /api/v1/tenants/**  → tenant-service                                   ││
│  │  /api/v1/orgs/**     → organization-service                             ││
│  │  /api/v1/employees/**→ employee-service                                 ││
│  │  /api/v1/attendance/**→ attendance-service                              ││
│  │  /api/v1/approvals/**→ approval-service                                 ││
│  │  /api/v1/mdm/**      → mdm-service                                      ││
│  │  /api/v1/files/**    → file-service                                     ││
│  │  /api/v1/notifications/**→ notification-service                         ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │                     Supporting Components                                 ││
│  │                                                                          ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  ││
│  │  │   Redis      │  │  Keycloak    │  │  Resilience4j │                  ││
│  │  │ (Rate Limit) │  │  (Auth)      │  │ (Circuit Brk) │                  ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘                  ││
│  └──────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 요청 흐름

```
Client Request
      │
      ▼
┌─────────────┐
│   Ingress   │
│   (ALB)     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Gateway Service                             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
│  │   CORS    │→ │   Rate    │→ │   Auth    │→ │  Tenant   │   │
│  │   Check   │  │  Limiter  │  │  Verify   │  │  Context  │   │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘   │
│        │              │              │              │           │
│        ▼              ▼              ▼              ▼           │
│     Reject       Reject(429)    Reject(401)    Add Header      │
│     or Pass      or Pass        or Pass        X-Tenant-ID     │
│                                                     │           │
│                                                     ▼           │
│                                          ┌───────────────┐     │
│                                          │ Route Match & │     │
│                                          │ Load Balance  │     │
│                                          └───────┬───────┘     │
└──────────────────────────────────────────────────┼──────────────┘
                                                   │
                          ┌────────────────────────┼────────────────────────┐
                          ▼                        ▼                        ▼
                  ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
                  │tenant-service│        │employee-svc  │        │approval-svc  │
                  └──────────────┘        └──────────────┘        └──────────────┘
```

---

## 3. 라우팅 설정

### 3.1 라우트 정의

```yaml
spring:
  cloud:
    gateway:
      routes:
        # Auth Service (Public)
        - id: auth-service
          uri: lb://auth-service
          predicates:
            - Path=/api/v1/auth/**
          filters:
            - StripPrefix=2
            - name: CircuitBreaker
              args:
                name: authCircuitBreaker
                fallbackUri: forward:/fallback/auth

        # Tenant Service
        - id: tenant-service
          uri: lb://tenant-service
          predicates:
            - Path=/api/v1/tenants/**
          filters:
            - StripPrefix=2
            - name: CircuitBreaker
              args:
                name: tenantCircuitBreaker
          metadata:
            auth-required: true
            roles: SUPER_ADMIN,GROUP_ADMIN,TENANT_ADMIN

        # Organization Service
        - id: organization-service
          uri: lb://organization-service
          predicates:
            - Path=/api/v1/organizations/**, /api/v1/departments/**, /api/v1/positions/**
          filters:
            - StripPrefix=2
            - name: CircuitBreaker
              args:
                name: orgCircuitBreaker
          metadata:
            auth-required: true

        # Employee Service
        - id: employee-service
          uri: lb://employee-service
          predicates:
            - Path=/api/v1/employees/**, /api/v1/families/**
          filters:
            - StripPrefix=2
            - name: CircuitBreaker
              args:
                name: employeeCircuitBreaker
          metadata:
            auth-required: true

        # Attendance Service
        - id: attendance-service
          uri: lb://attendance-service
          predicates:
            - Path=/api/v1/attendance/**, /api/v1/leaves/**
          filters:
            - StripPrefix=2
            - name: CircuitBreaker
              args:
                name: attendanceCircuitBreaker
          metadata:
            auth-required: true

        # Approval Service
        - id: approval-service
          uri: lb://approval-service
          predicates:
            - Path=/api/v1/approvals/**, /api/v1/workflows/**
          filters:
            - StripPrefix=2
            - name: CircuitBreaker
              args:
                name: approvalCircuitBreaker
          metadata:
            auth-required: true

        # MDM Service
        - id: mdm-service
          uri: lb://mdm-service
          predicates:
            - Path=/api/v1/mdm/**, /api/v1/codes/**
          filters:
            - StripPrefix=2
            - name: CircuitBreaker
              args:
                name: mdmCircuitBreaker
          metadata:
            auth-required: true

        # Notification Service
        - id: notification-service
          uri: lb://notification-service
          predicates:
            - Path=/api/v1/notifications/**
          filters:
            - StripPrefix=2
            - name: CircuitBreaker
              args:
                name: notificationCircuitBreaker
          metadata:
            auth-required: true

        # File Service
        - id: file-service
          uri: lb://file-service
          predicates:
            - Path=/api/v1/files/**
          filters:
            - StripPrefix=2
            - name: CircuitBreaker
              args:
                name: fileCircuitBreaker
          metadata:
            auth-required: true
```

### 3.2 API 버저닝

```
URL 패턴: /api/v{version}/{service}/{resource}

예시:
- /api/v1/employees/123        → employee-service v1
- /api/v2/employees/123        → employee-service v2 (향후)
```

---

## 4. 인증/인가

### 4.1 Security Configuration

```java
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}")
    private String issuerUri;

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeExchange(exchanges -> exchanges
                // Public endpoints
                .pathMatchers("/actuator/health/**").permitAll()
                .pathMatchers("/api/v1/auth/**").permitAll()
                .pathMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                // Protected endpoints
                .pathMatchers("/api/v1/tenants/**").hasAnyRole("SUPER_ADMIN", "GROUP_ADMIN", "TENANT_ADMIN")
                .pathMatchers(HttpMethod.GET, "/api/v1/**").authenticated()
                .pathMatchers(HttpMethod.POST, "/api/v1/**").authenticated()
                .pathMatchers(HttpMethod.PUT, "/api/v1/**").authenticated()
                .pathMatchers(HttpMethod.DELETE, "/api/v1/**").authenticated()
                .anyExchange().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtDecoder(jwtDecoder())
                    .jwtAuthenticationConverter(jwtAuthenticationConverter())
                )
            )
            .build();
    }

    @Bean
    public ReactiveJwtDecoder jwtDecoder() {
        return ReactiveJwtDecoders.fromIssuerLocation(issuerUri);
    }

    @Bean
    public Converter<Jwt, Mono<AbstractAuthenticationToken>> jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");
        grantedAuthoritiesConverter.setAuthoritiesClaimName("roles");

        ReactiveJwtAuthenticationConverterAdapter converter = 
            new ReactiveJwtAuthenticationConverterAdapter(
                new JwtAuthenticationConverter() {{
                    setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
                }}
            );
        return converter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

### 4.2 Tenant Context Filter

```java
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 100)
public class TenantContextFilter implements GlobalFilter {

    private static final String TENANT_ID_HEADER = "X-Tenant-ID";
    private static final String USER_ID_HEADER = "X-User-ID";
    private static final String USER_ROLES_HEADER = "X-User-Roles";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return ReactiveSecurityContextHolder.getContext()
            .map(SecurityContext::getAuthentication)
            .cast(JwtAuthenticationToken.class)
            .flatMap(auth -> {
                Jwt jwt = auth.getToken();
                
                String tenantId = jwt.getClaimAsString("tenant_id");
                String userId = jwt.getClaimAsString("sub");
                List<String> roles = jwt.getClaimAsStringList("roles");
                
                if (tenantId == null) {
                    return Mono.error(new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "Tenant ID not found in token"));
                }
                
                ServerHttpRequest request = exchange.getRequest().mutate()
                    .header(TENANT_ID_HEADER, tenantId)
                    .header(USER_ID_HEADER, userId)
                    .header(USER_ROLES_HEADER, String.join(",", roles))
                    .build();
                
                return chain.filter(exchange.mutate().request(request).build());
            })
            .switchIfEmpty(chain.filter(exchange));
    }
}
```

### 4.3 JWT Claim 구조

```json
{
  "sub": "user-uuid-12345",
  "iss": "https://auth.hr-saas.example.com/realms/hr-saas",
  "aud": "hr-saas-client",
  "exp": 1706918400,
  "iat": 1706914800,
  "tenant_id": "tenant-uuid-67890",
  "tenant_code": "COMPANY_A",
  "employee_id": "emp-uuid-11111",
  "employee_number": "EMP001",
  "roles": ["EMPLOYEE", "TEAM_LEADER"],
  "permissions": [
    "employee:read",
    "employee:write",
    "leave:request",
    "leave:approve"
  ],
  "department_id": "dept-uuid-22222",
  "position_id": "pos-uuid-33333"
}
```

---

## 5. Rate Limiting

### 5.1 Redis Rate Limiter 설정

```java
@Configuration
public class RateLimiterConfig {

    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> ReactiveSecurityContextHolder.getContext()
            .map(ctx -> ctx.getAuthentication().getName())
            .defaultIfEmpty(exchange.getRequest().getRemoteAddress().getAddress().getHostAddress());
    }

    @Bean
    public KeyResolver tenantKeyResolver() {
        return exchange -> Mono.justOrEmpty(
            exchange.getRequest().getHeaders().getFirst("X-Tenant-ID")
        ).defaultIfEmpty("anonymous");
    }

    @Bean
    public KeyResolver ipKeyResolver() {
        return exchange -> Mono.just(
            exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
        );
    }

    @Bean
    public RedisRateLimiter redisRateLimiter() {
        return new RedisRateLimiter(100, 200, 1);
        // replenishRate: 초당 100개 요청
        // burstCapacity: 최대 200개 버스트
        // requestedTokens: 요청당 1개 토큰
    }
}
```

### 5.2 Rate Limit 정책

```yaml
spring:
  cloud:
    gateway:
      default-filters:
        - name: RequestRateLimiter
          args:
            redis-rate-limiter.replenishRate: 100
            redis-rate-limiter.burstCapacity: 200
            redis-rate-limiter.requestedTokens: 1
            key-resolver: "#{@userKeyResolver}"
            deny-empty-key: false
            empty-key-status-code: 429

      routes:
        # 파일 업로드는 더 낮은 Rate Limit
        - id: file-upload
          uri: lb://file-service
          predicates:
            - Path=/api/v1/files/upload
            - Method=POST
          filters:
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 10
                redis-rate-limiter.burstCapacity: 20
                key-resolver: "#{@userKeyResolver}"
```

### 5.3 Rate Limit 응답 헤더

```
X-RateLimit-Remaining: 95
X-RateLimit-Limit: 100
X-RateLimit-Reset: 1706918400
```

---

## 6. 필터 체인

### 6.1 Global Filters

```java
// 1. Request Logging Filter
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestLoggingFilter implements GlobalFilter {
    
    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);
    
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String requestId = UUID.randomUUID().toString();
        
        long startTime = System.currentTimeMillis();
        
        log.info("Incoming request: {} {} [{}]", 
            request.getMethod(), 
            request.getURI().getPath(),
            requestId);
        
        ServerHttpRequest mutatedRequest = request.mutate()
            .header("X-Request-ID", requestId)
            .build();
        
        return chain.filter(exchange.mutate().request(mutatedRequest).build())
            .doFinally(signalType -> {
                long duration = System.currentTimeMillis() - startTime;
                log.info("Request completed: {} {} [{}] - {} ms", 
                    request.getMethod(),
                    request.getURI().getPath(),
                    requestId,
                    duration);
            });
    }
}

// 2. Response Headers Filter
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class ResponseHeadersFilter implements GlobalFilter {
    
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            ServerHttpResponse response = exchange.getResponse();
            HttpHeaders headers = response.getHeaders();
            
            // Security Headers
            headers.add("X-Content-Type-Options", "nosniff");
            headers.add("X-Frame-Options", "DENY");
            headers.add("X-XSS-Protection", "1; mode=block");
            headers.add("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
            
            // Request ID
            String requestId = exchange.getRequest().getHeaders().getFirst("X-Request-ID");
            if (requestId != null) {
                headers.add("X-Request-ID", requestId);
            }
        }));
    }
}
```

### 6.2 Custom Gateway Filters

```java
// API Version Header Filter
@Component
public class ApiVersionFilter implements GatewayFilterFactory<ApiVersionFilter.Config> {
    
    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String path = exchange.getRequest().getURI().getPath();
            String version = extractVersion(path);
            
            ServerHttpRequest request = exchange.getRequest().mutate()
                .header("X-API-Version", version)
                .build();
            
            return chain.filter(exchange.mutate().request(request).build());
        };
    }
    
    private String extractVersion(String path) {
        if (path.contains("/v1/")) return "v1";
        if (path.contains("/v2/")) return "v2";
        return "v1";
    }
    
    @Data
    public static class Config {
        private String defaultVersion = "v1";
    }
}
```

### 6.3 필터 실행 순서

```
Request →
  1. RequestLoggingFilter (HIGHEST_PRECEDENCE)
  2. CORS Filter
  3. Rate Limiter Filter
  4. Authentication Filter
  5. TenantContextFilter
  6. Route Specific Filters
  7. Load Balancer Filter
→ Downstream Service

Response ←
  1. ResponseHeadersFilter (LOWEST_PRECEDENCE)
← Client
```

---

## 7. Circuit Breaker

### 7.1 Resilience4j 설정

```yaml
resilience4j:
  circuitbreaker:
    configs:
      default:
        slidingWindowType: COUNT_BASED
        slidingWindowSize: 10
        minimumNumberOfCalls: 5
        failureRateThreshold: 50
        waitDurationInOpenState: 30s
        permittedNumberOfCallsInHalfOpenState: 3
        automaticTransitionFromOpenToHalfOpenEnabled: true
        recordExceptions:
          - java.io.IOException
          - java.util.concurrent.TimeoutException
          - org.springframework.web.client.HttpServerErrorException
        ignoreExceptions:
          - org.springframework.web.client.HttpClientErrorException
    instances:
      authCircuitBreaker:
        baseConfig: default
      tenantCircuitBreaker:
        baseConfig: default
      employeeCircuitBreaker:
        baseConfig: default
        slidingWindowSize: 20
        failureRateThreshold: 60
      approvalCircuitBreaker:
        baseConfig: default
        waitDurationInOpenState: 60s
        
  timelimiter:
    configs:
      default:
        timeoutDuration: 10s
        cancelRunningFuture: true
    instances:
      fileCircuitBreaker:
        timeoutDuration: 30s  # 파일 업로드는 더 긴 타임아웃
```

### 7.2 Fallback Controller

```java
@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @GetMapping("/auth")
    public Mono<ResponseEntity<ErrorResponse>> authFallback() {
        return Mono.just(ResponseEntity
            .status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(new ErrorResponse(
                "SERVICE_UNAVAILABLE",
                "Authentication service is temporarily unavailable",
                Instant.now()
            )));
    }

    @GetMapping("/default")
    public Mono<ResponseEntity<ErrorResponse>> defaultFallback() {
        return Mono.just(ResponseEntity
            .status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(new ErrorResponse(
                "SERVICE_UNAVAILABLE",
                "Service is temporarily unavailable. Please try again later.",
                Instant.now()
            )));
    }

    @Data
    @AllArgsConstructor
    public static class ErrorResponse {
        private String code;
        private String message;
        private Instant timestamp;
    }
}
```

---

## 8. API 명세

### 8.1 Gateway 자체 API

```yaml
openapi: 3.0.3
info:
  title: HR SaaS Gateway API
  version: 1.0.0

paths:
  /actuator/health:
    get:
      summary: Health Check
      tags: [System]
      responses:
        '200':
          description: Service is healthy
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthResponse'

  /actuator/gateway/routes:
    get:
      summary: List all routes
      tags: [System]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: List of configured routes

  /actuator/gateway/routes/{id}:
    get:
      summary: Get route by ID
      tags: [System]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Route details

components:
  schemas:
    HealthResponse:
      type: object
      properties:
        status:
          type: string
          enum: [UP, DOWN]
        components:
          type: object

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

### 8.2 에러 응답 형식

```json
{
  "timestamp": "2025-02-03T10:30:00Z",
  "status": 401,
  "error": "Unauthorized",
  "code": "AUTH_001",
  "message": "Invalid or expired token",
  "path": "/api/v1/employees",
  "requestId": "abc-123-def-456"
}
```

### 8.3 에러 코드 정의

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| AUTH_001 | 401 | Invalid or expired token |
| AUTH_002 | 403 | Insufficient permissions |
| AUTH_003 | 403 | Tenant access denied |
| RATE_001 | 429 | Rate limit exceeded |
| SVC_001 | 503 | Service unavailable |
| SVC_002 | 504 | Gateway timeout |
| VAL_001 | 400 | Invalid request format |

---

## 9. 설정

### 9.1 application.yml

```yaml
server:
  port: 8080
  
spring:
  application:
    name: gateway-service
    
  # Redis
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}
      
  # Security
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: ${KEYCLOAK_ISSUER_URI:http://localhost:8180/realms/hr-saas}
          
  # Cloud Gateway
  cloud:
    gateway:
      discovery:
        locator:
          enabled: false
      globalcors:
        corsConfigurations:
          '[/**]':
            allowedOriginPatterns: "*"
            allowedMethods:
              - GET
              - POST
              - PUT
              - DELETE
              - OPTIONS
            allowedHeaders: "*"
            allowCredentials: true
            maxAge: 3600

# Actuator
management:
  endpoints:
    web:
      exposure:
        include: health,info,gateway,prometheus,metrics
  endpoint:
    health:
      show-details: when_authorized
    gateway:
      enabled: true
      
# Logging
logging:
  level:
    org.springframework.cloud.gateway: DEBUG
    org.springframework.security: DEBUG
    reactor.netty: INFO
```

### 9.2 Kubernetes ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: gateway-service-config
  namespace: hr-saas-system
data:
  SPRING_PROFILES_ACTIVE: "kubernetes"
  REDIS_HOST: "hr-saas-redis.hr-saas-infra.svc.cluster.local"
  REDIS_PORT: "6379"
  KEYCLOAK_ISSUER_URI: "http://keycloak.hr-saas-infra.svc.cluster.local:8080/realms/hr-saas"
```

---

## 10. 모니터링

### 10.1 메트릭

```java
@Component
public class GatewayMetrics {
    
    private final MeterRegistry meterRegistry;
    private final Counter requestCounter;
    private final Timer requestTimer;
    
    public GatewayMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        
        this.requestCounter = Counter.builder("gateway.requests.total")
            .description("Total number of requests processed")
            .tag("service", "gateway")
            .register(meterRegistry);
            
        this.requestTimer = Timer.builder("gateway.request.duration")
            .description("Request processing duration")
            .tag("service", "gateway")
            .register(meterRegistry);
    }
    
    public void recordRequest(String route, String method, int status, long duration) {
        meterRegistry.counter("gateway.requests",
            "route", route,
            "method", method,
            "status", String.valueOf(status)
        ).increment();
        
        meterRegistry.timer("gateway.request.latency",
            "route", route
        ).record(Duration.ofMillis(duration));
    }
}
```

### 10.2 주요 메트릭

| 메트릭 | 설명 | 알람 임계값 |
|--------|------|-----------|
| `gateway.requests.total` | 총 요청 수 | - |
| `gateway.request.duration` | 요청 처리 시간 | P95 > 500ms |
| `gateway.circuit.breaker.state` | Circuit Breaker 상태 | OPEN 발생 시 |
| `gateway.rate.limit.exceeded` | Rate Limit 초과 횟수 | > 100/min |
| `gateway.errors` | 에러 발생 횟수 | > 10/min |

### 10.3 Grafana 대시보드 패널

```json
{
  "panels": [
    {
      "title": "Request Rate by Route",
      "type": "timeseries",
      "targets": [{
        "expr": "sum(rate(gateway_requests_total[5m])) by (route)"
      }]
    },
    {
      "title": "Response Time (P95)",
      "type": "timeseries",
      "targets": [{
        "expr": "histogram_quantile(0.95, sum(rate(gateway_request_duration_seconds_bucket[5m])) by (le, route))"
      }]
    },
    {
      "title": "Error Rate",
      "type": "stat",
      "targets": [{
        "expr": "sum(rate(gateway_requests_total{status=~\"5..\"}[5m])) / sum(rate(gateway_requests_total[5m])) * 100"
      }]
    },
    {
      "title": "Circuit Breaker Status",
      "type": "table",
      "targets": [{
        "expr": "resilience4j_circuitbreaker_state"
      }]
    }
  ]
}
```

---

## 변경 이력

| 버전 | 일자 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2025-02-03 | - | 최초 작성 |

---

**문서 끝**