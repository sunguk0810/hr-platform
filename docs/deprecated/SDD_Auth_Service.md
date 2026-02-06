> **DEPRECATED**: 이 문서는 초기 설계 문서로, Keycloak/Kafka 기반으로 작성되었습니다.
> 현재 구현(Custom JWT, SQS/SNS)과 다릅니다. 최신 분석은 [`docs/modules/01-AUTH-SERVICE.md`](modules/01-AUTH-SERVICE.md)를 참조하세요.

# Auth Service - Software Design Document (SDD)

**문서 버전**: 1.0
**작성일**: 2025-02-03  
**서비스명**: auth-service  
**포트**: 8081  

---

## 목차

1. [서비스 개요](#1-서비스-개요)
2. [아키텍처](#2-아키텍처)
3. [Keycloak 연동](#3-keycloak-연동)
4. [인증 흐름](#4-인증-흐름)
5. [토큰 관리](#5-토큰-관리)
6. [권한 관리](#6-권한-관리)
7. [API 명세](#7-api-명세)
8. [데이터 모델](#8-데이터-모델)
9. [설정](#9-설정)

---

## 1. 서비스 개요

### 1.1 목적

Auth Service는 HR SaaS 플랫폼의 인증/인가를 담당하며, Keycloak과의 연동을 통해 SSO(Single Sign-On)를 제공합니다.

### 1.2 주요 기능

- Keycloak 연동 및 토큰 발급/갱신
- 사용자 로그인/로그아웃
- 비밀번호 변경/초기화
- 다중 테넌트 인증 컨텍스트 관리
- 세션 관리 (Redis)
- 권한 동기화

### 1.3 기술 스택

| 구분 | 기술 |
|------|------|
| Framework | Spring Boot 3.2 + Spring Security |
| IdP | Keycloak 23.x |
| Protocol | OAuth 2.0 / OpenID Connect |
| Session | Redis |
| Client | Spring Security OAuth2 Client |

---

## 2. 아키텍처

### 2.1 컴포넌트 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Auth Service                                     │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        Controller Layer                                  ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  ││
│  │  │    Auth      │  │    User      │  │   Session    │                  ││
│  │  │  Controller  │  │  Controller  │  │  Controller  │                  ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘                  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│  ┌─────────────────────────────────▼───────────────────────────────────────┐│
│  │                         Service Layer                                    ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  ││
│  │  │ Keycloak     │  │    Token     │  │   Session    │                  ││
│  │  │   Service    │  │   Service    │  │   Service    │                  ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘                  ││
│  │  ┌──────────────┐  ┌──────────────┐                                    ││
│  │  │    User      │  │  Permission  │                                    ││
│  │  │   Service    │  │   Service    │                                    ││
│  │  └──────────────┘  └──────────────┘                                    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│  ┌─────────────────────────────────▼───────────────────────────────────────┐│
│  │                       Integration Layer                                  ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  ││
│  │  │  Keycloak    │  │    Redis     │  │   Kafka      │                  ││
│  │  │   Client     │  │   Client     │  │  Producer    │                  ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘                  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
           ┌──────────────┐            ┌──────────────┐
           │   Keycloak   │            │    Redis     │
           │     (IdP)    │            │  (Session)   │
           └──────────────┘            └──────────────┘
```

### 2.2 인증 흐름 시퀀스

```
┌──────┐     ┌─────────┐     ┌────────────┐     ┌──────────┐
│Client│     │ Gateway │     │Auth Service│     │ Keycloak │
└──┬───┘     └────┬────┘     └─────┬──────┘     └────┬─────┘
   │              │                │                  │
   │ 1. Login     │                │                  │
   │─────────────▶│                │                  │
   │              │ 2. Forward     │                  │
   │              │───────────────▶│                  │
   │              │                │ 3. Auth Request  │
   │              │                │─────────────────▶│
   │              │                │                  │
   │              │                │ 4. Token Response│
   │              │                │◀─────────────────│
   │              │                │                  │
   │              │ 5. Set Session │                  │
   │              │ (Redis)        │                  │
   │              │                │                  │
   │              │ 6. Response    │                  │
   │              │◀───────────────│                  │
   │ 7. Token +   │                │                  │
   │    Session   │                │                  │
   │◀─────────────│                │                  │
```

---

## 3. Keycloak 연동

### 3.1 Realm 구성

```
hr-saas (Realm)
├── Clients
│   ├── hr-saas-web (Public Client - SPA)
│   ├── hr-saas-api (Confidential Client - Backend)
│   └── hr-saas-admin (Admin CLI)
├── Roles
│   ├── Realm Roles
│   │   ├── SUPER_ADMIN
│   │   ├── GROUP_ADMIN
│   │   ├── TENANT_ADMIN
│   │   ├── HR_MANAGER
│   │   ├── DEPT_MANAGER
│   │   ├── TEAM_LEADER
│   │   └── EMPLOYEE
│   └── Client Roles
│       └── (service-specific roles)
├── Groups
│   └── (Tenant-based groups)
├── Identity Providers (선택적)
│   ├── SAML
│   └── OIDC (계열사 IdP 연동)
└── User Federation (선택적)
    └── LDAP
```

### 3.2 Keycloak Admin Client 설정

```java
@Configuration
public class KeycloakConfig {

    @Value("${keycloak.auth-server-url}")
    private String serverUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.admin.username}")
    private String adminUsername;

    @Value("${keycloak.admin.password}")
    private String adminPassword;

    @Bean
    public Keycloak keycloakAdminClient() {
        return KeycloakBuilder.builder()
            .serverUrl(serverUrl)
            .realm("master")
            .clientId("admin-cli")
            .username(adminUsername)
            .password(adminPassword)
            .build();
    }

    @Bean
    public RealmResource realmResource(Keycloak keycloak) {
        return keycloak.realm(realm);
    }
}
```

### 3.3 사용자 프로비저닝

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class KeycloakUserService {

    private final RealmResource realmResource;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public String createUser(CreateUserRequest request) {
        UserRepresentation user = new UserRepresentation();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEnabled(true);
        user.setEmailVerified(true);

        // Custom Attributes (테넌트 정보)
        Map<String, List<String>> attributes = new HashMap<>();
        attributes.put("tenant_id", List.of(request.getTenantId()));
        attributes.put("employee_id", List.of(request.getEmployeeId()));
        attributes.put("employee_number", List.of(request.getEmployeeNumber()));
        user.setAttributes(attributes);

        // 비밀번호 설정
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(request.getInitialPassword());
        credential.setTemporary(true); // 첫 로그인 시 변경 필요
        user.setCredentials(List.of(credential));

        // 사용자 생성
        Response response = realmResource.users().create(user);
        if (response.getStatus() != 201) {
            throw new KeycloakException("Failed to create user: " + response.getStatusInfo());
        }

        String userId = extractUserId(response);
        
        // 역할 할당
        assignRoles(userId, request.getRoles());

        // 이벤트 발행
        kafkaTemplate.send("auth.user-created", new UserCreatedEvent(userId, request));

        return userId;
    }

    public void assignRoles(String userId, List<String> roleNames) {
        UserResource userResource = realmResource.users().get(userId);
        
        List<RoleRepresentation> roles = roleNames.stream()
            .map(roleName -> realmResource.roles().get(roleName).toRepresentation())
            .collect(Collectors.toList());
        
        userResource.roles().realmLevel().add(roles);
    }

    public void updateUserAttributes(String userId, Map<String, List<String>> attributes) {
        UserResource userResource = realmResource.users().get(userId);
        UserRepresentation user = userResource.toRepresentation();
        
        Map<String, List<String>> existingAttributes = user.getAttributes();
        if (existingAttributes == null) {
            existingAttributes = new HashMap<>();
        }
        existingAttributes.putAll(attributes);
        user.setAttributes(existingAttributes);
        
        userResource.update(user);
    }

    private String extractUserId(Response response) {
        String location = response.getHeaderString("Location");
        return location.substring(location.lastIndexOf('/') + 1);
    }
}
```

---

## 4. 인증 흐름

### 4.1 로그인 서비스

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {

    private final KeycloakTokenService tokenService;
    private final SessionService sessionService;
    private final TenantServiceClient tenantServiceClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public LoginResponse login(LoginRequest request) {
        // 1. Keycloak 토큰 발급
        TokenResponse tokenResponse = tokenService.getToken(
            request.getUsername(), 
            request.getPassword()
        );

        // 2. 토큰에서 사용자 정보 추출
        DecodedJWT jwt = JWT.decode(tokenResponse.getAccessToken());
        String userId = jwt.getSubject();
        String tenantId = jwt.getClaim("tenant_id").asString();
        List<String> roles = jwt.getClaim("roles").asList(String.class);

        // 3. 테넌트 정보 조회
        TenantInfo tenantInfo = tenantServiceClient.getTenant(tenantId);

        // 4. 세션 생성
        SessionInfo sessionInfo = SessionInfo.builder()
            .userId(userId)
            .tenantId(tenantId)
            .tenantCode(tenantInfo.getCode())
            .roles(roles)
            .accessToken(tokenResponse.getAccessToken())
            .refreshToken(tokenResponse.getRefreshToken())
            .expiresAt(Instant.now().plusSeconds(tokenResponse.getExpiresIn()))
            .build();

        String sessionId = sessionService.createSession(sessionInfo);

        // 5. 로그인 이벤트 발행
        kafkaTemplate.send("auth.user-logged-in", new UserLoggedInEvent(
            userId, tenantId, request.getIpAddress(), Instant.now()
        ));

        // 6. 응답 반환
        return LoginResponse.builder()
            .accessToken(tokenResponse.getAccessToken())
            .refreshToken(tokenResponse.getRefreshToken())
            .expiresIn(tokenResponse.getExpiresIn())
            .sessionId(sessionId)
            .user(UserInfo.builder()
                .id(userId)
                .tenantId(tenantId)
                .tenantCode(tenantInfo.getCode())
                .tenantName(tenantInfo.getName())
                .roles(roles)
                .build())
            .build();
    }

    public void logout(String sessionId) {
        SessionInfo session = sessionService.getSession(sessionId);
        if (session == null) {
            return;
        }

        // Keycloak 토큰 무효화
        tokenService.logout(session.getRefreshToken());

        // 세션 삭제
        sessionService.deleteSession(sessionId);

        // 로그아웃 이벤트 발행
        kafkaTemplate.send("auth.user-logged-out", new UserLoggedOutEvent(
            session.getUserId(), session.getTenantId(), Instant.now()
        ));
    }

    public TokenResponse refreshToken(String refreshToken) {
        return tokenService.refreshToken(refreshToken);
    }
}
```

### 4.2 Keycloak 토큰 서비스

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class KeycloakTokenService {

    @Value("${keycloak.auth-server-url}")
    private String serverUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.client-id}")
    private String clientId;

    @Value("${keycloak.client-secret}")
    private String clientSecret;

    private final RestTemplate restTemplate;

    public TokenResponse getToken(String username, String password) {
        String tokenUrl = serverUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "password");
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("username", username);
        params.add("password", password);
        params.add("scope", "openid profile email");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            ResponseEntity<TokenResponse> response = restTemplate.postForEntity(
                tokenUrl, request, TokenResponse.class
            );
            return response.getBody();
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                throw new InvalidCredentialsException("Invalid username or password");
            }
            throw new AuthenticationException("Authentication failed", e);
        }
    }

    public TokenResponse refreshToken(String refreshToken) {
        String tokenUrl = serverUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "refresh_token");
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("refresh_token", refreshToken);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            ResponseEntity<TokenResponse> response = restTemplate.postForEntity(
                tokenUrl, request, TokenResponse.class
            );
            return response.getBody();
        } catch (HttpClientErrorException e) {
            throw new TokenRefreshException("Failed to refresh token", e);
        }
    }

    public void logout(String refreshToken) {
        String logoutUrl = serverUrl + "/realms/" + realm + "/protocol/openid-connect/logout";

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("refresh_token", refreshToken);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            restTemplate.postForEntity(logoutUrl, request, Void.class);
        } catch (Exception e) {
            log.warn("Failed to logout from Keycloak", e);
        }
    }
}
```

---

## 5. 토큰 관리

### 5.1 JWT Custom Claims

```json
{
  "sub": "user-uuid-12345",
  "iss": "https://auth.hr-saas.example.com/realms/hr-saas",
  "aud": ["hr-saas-api", "hr-saas-web"],
  "exp": 1706918400,
  "iat": 1706914800,
  "auth_time": 1706914800,
  "jti": "token-uuid-67890",
  "typ": "Bearer",
  "azp": "hr-saas-web",
  "session_state": "session-uuid-11111",
  "acr": "1",
  "allowed-origins": ["https://hr-saas.example.com"],
  "realm_access": {
    "roles": ["EMPLOYEE", "TEAM_LEADER"]
  },
  "scope": "openid profile email",
  "tenant_id": "tenant-uuid-22222",
  "tenant_code": "COMPANY_A",
  "employee_id": "emp-uuid-33333",
  "employee_number": "EMP001",
  "department_id": "dept-uuid-44444",
  "position_id": "pos-uuid-55555",
  "name": "홍길동",
  "email": "hong@company-a.com",
  "preferred_username": "hong.gildong"
}
```

### 5.2 Protocol Mapper 설정 (Keycloak)

```java
// Keycloak에서 설정할 Protocol Mapper 목록
public class ProtocolMapperConfig {

    public static List<ProtocolMapperRepresentation> getCustomMappers() {
        List<ProtocolMapperRepresentation> mappers = new ArrayList<>();

        // tenant_id 매퍼
        mappers.add(createUserAttributeMapper(
            "tenant_id", "tenant_id", "String", true, true
        ));

        // tenant_code 매퍼
        mappers.add(createUserAttributeMapper(
            "tenant_code", "tenant_code", "String", true, true
        ));

        // employee_id 매퍼
        mappers.add(createUserAttributeMapper(
            "employee_id", "employee_id", "String", true, true
        ));

        // employee_number 매퍼
        mappers.add(createUserAttributeMapper(
            "employee_number", "employee_number", "String", true, true
        ));

        // department_id 매퍼
        mappers.add(createUserAttributeMapper(
            "department_id", "department_id", "String", true, true
        ));

        // position_id 매퍼
        mappers.add(createUserAttributeMapper(
            "position_id", "position_id", "String", true, true
        ));

        return mappers;
    }

    private static ProtocolMapperRepresentation createUserAttributeMapper(
            String name, String userAttribute, String jsonType,
            boolean addToIdToken, boolean addToAccessToken) {
        
        ProtocolMapperRepresentation mapper = new ProtocolMapperRepresentation();
        mapper.setName(name);
        mapper.setProtocol("openid-connect");
        mapper.setProtocolMapper("oidc-usermodel-attribute-mapper");
        
        Map<String, String> config = new HashMap<>();
        config.put("user.attribute", userAttribute);
        config.put("claim.name", name);
        config.put("jsonType.label", jsonType);
        config.put("id.token.claim", String.valueOf(addToIdToken));
        config.put("access.token.claim", String.valueOf(addToAccessToken));
        config.put("userinfo.token.claim", "true");
        mapper.setConfig(config);
        
        return mapper;
    }
}
```

---

## 6. 권한 관리

### 6.1 역할 계층 구조

```java
@Configuration
public class RoleHierarchyConfig {

    @Bean
    public RoleHierarchy roleHierarchy() {
        RoleHierarchyImpl hierarchy = new RoleHierarchyImpl();
        hierarchy.setHierarchy("""
            ROLE_SUPER_ADMIN > ROLE_GROUP_ADMIN
            ROLE_GROUP_ADMIN > ROLE_TENANT_ADMIN
            ROLE_TENANT_ADMIN > ROLE_HR_MANAGER
            ROLE_HR_MANAGER > ROLE_DEPT_MANAGER
            ROLE_DEPT_MANAGER > ROLE_TEAM_LEADER
            ROLE_TEAM_LEADER > ROLE_EMPLOYEE
        """);
        return hierarchy;
    }
}
```

### 6.2 Permission 서비스

```java
@Service
@RequiredArgsConstructor
public class PermissionService {

    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;

    // 역할별 기본 권한 매핑
    private static final Map<String, Set<String>> ROLE_PERMISSIONS = Map.of(
        "SUPER_ADMIN", Set.of("*:*"),
        "GROUP_ADMIN", Set.of(
            "tenant:read", "tenant:write",
            "organization:read", "organization:write",
            "employee:read", "employee:write",
            "report:read"
        ),
        "TENANT_ADMIN", Set.of(
            "organization:read", "organization:write",
            "employee:read", "employee:write",
            "attendance:read", "attendance:write",
            "approval:read", "approval:write",
            "mdm:read", "mdm:write"
        ),
        "HR_MANAGER", Set.of(
            "organization:read",
            "employee:read", "employee:write",
            "attendance:read", "attendance:write",
            "approval:read"
        ),
        "DEPT_MANAGER", Set.of(
            "organization:read",
            "employee:read:department",
            "attendance:read:department", "attendance:approve",
            "approval:read", "approval:approve"
        ),
        "TEAM_LEADER", Set.of(
            "employee:read:team",
            "attendance:read:team", "attendance:approve:team",
            "approval:read", "approval:approve:team"
        ),
        "EMPLOYEE", Set.of(
            "employee:read:self", "employee:write:self",
            "attendance:read:self", "attendance:request",
            "approval:read:self", "approval:request"
        )
    );

    public Set<String> getPermissions(String userId, String tenantId, List<String> roles) {
        Set<String> permissions = new HashSet<>();
        
        // 역할 기반 권한
        for (String role : roles) {
            Set<String> rolePerms = ROLE_PERMISSIONS.get(role);
            if (rolePerms != null) {
                permissions.addAll(rolePerms);
            }
        }
        
        // 테넌트별 커스텀 권한 (DB에서 조회)
        List<Permission> customPermissions = permissionRepository
            .findByUserIdAndTenantId(userId, tenantId);
        customPermissions.forEach(p -> permissions.add(p.getPermissionCode()));
        
        return permissions;
    }

    public boolean hasPermission(String userId, String tenantId, 
                                 List<String> roles, String permission) {
        Set<String> userPermissions = getPermissions(userId, tenantId, roles);
        
        // 와일드카드 체크
        if (userPermissions.contains("*:*")) {
            return true;
        }
        
        // 직접 매칭
        if (userPermissions.contains(permission)) {
            return true;
        }
        
        // 리소스 와일드카드 체크 (예: employee:* 가 employee:read를 포함)
        String[] parts = permission.split(":");
        if (parts.length == 2) {
            if (userPermissions.contains(parts[0] + ":*")) {
                return true;
            }
        }
        
        return false;
    }
}
```

---

## 7. API 명세

### 7.1 인증 API

```yaml
openapi: 3.0.3
info:
  title: Auth Service API
  version: 1.0.0

paths:
  /auth/login:
    post:
      summary: 로그인
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        '200':
          description: 로그인 성공
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoginResponse'
        '401':
          description: 인증 실패
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /auth/logout:
    post:
      summary: 로그아웃
      tags: [Authentication]
      security:
        - bearerAuth: []
      responses:
        '204':
          description: 로그아웃 성공

  /auth/refresh:
    post:
      summary: 토큰 갱신
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                refreshToken:
                  type: string
      responses:
        '200':
          description: 토큰 갱신 성공
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TokenResponse'

  /auth/me:
    get:
      summary: 현재 사용자 정보 조회
      tags: [Authentication]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: 사용자 정보
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserInfo'

  /auth/password/change:
    post:
      summary: 비밀번호 변경
      tags: [Password]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ChangePasswordRequest'
      responses:
        '204':
          description: 비밀번호 변경 성공
        '400':
          description: 잘못된 요청

  /auth/password/reset:
    post:
      summary: 비밀번호 초기화 요청
      tags: [Password]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
      responses:
        '204':
          description: 초기화 메일 발송

components:
  schemas:
    LoginRequest:
      type: object
      required:
        - username
        - password
      properties:
        username:
          type: string
        password:
          type: string
          format: password

    LoginResponse:
      type: object
      properties:
        accessToken:
          type: string
        refreshToken:
          type: string
        expiresIn:
          type: integer
        sessionId:
          type: string
        user:
          $ref: '#/components/schemas/UserInfo'

    TokenResponse:
      type: object
      properties:
        accessToken:
          type: string
        refreshToken:
          type: string
        expiresIn:
          type: integer

    UserInfo:
      type: object
      properties:
        id:
          type: string
          format: uuid
        tenantId:
          type: string
          format: uuid
        tenantCode:
          type: string
        tenantName:
          type: string
        employeeId:
          type: string
          format: uuid
        employeeNumber:
          type: string
        name:
          type: string
        email:
          type: string
          format: email
        roles:
          type: array
          items:
            type: string
        permissions:
          type: array
          items:
            type: string

    ChangePasswordRequest:
      type: object
      required:
        - currentPassword
        - newPassword
      properties:
        currentPassword:
          type: string
          format: password
        newPassword:
          type: string
          format: password
          minLength: 8

    ErrorResponse:
      type: object
      properties:
        code:
          type: string
        message:
          type: string
        timestamp:
          type: string
          format: date-time

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

---

## 8. 데이터 모델

### 8.1 세션 정보 (Redis)

```java
@Data
@Builder
@RedisHash(value = "session", timeToLive = 28800)  // 8시간
public class SessionInfo {
    
    @Id
    private String sessionId;
    
    private String userId;
    private String tenantId;
    private String tenantCode;
    private List<String> roles;
    private Set<String> permissions;
    
    @JsonIgnore
    private String accessToken;
    
    @JsonIgnore
    private String refreshToken;
    
    private Instant createdAt;
    private Instant expiresAt;
    private String ipAddress;
    private String userAgent;
}
```

### 8.2 감사 로그 테이블

```sql
-- 인증 이벤트 로그
CREATE TABLE auth_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,  -- LOGIN, LOGOUT, TOKEN_REFRESH, PASSWORD_CHANGE
    user_id UUID,
    tenant_id UUID,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_audit_user ON auth_audit_log(user_id);
CREATE INDEX idx_auth_audit_tenant ON auth_audit_log(tenant_id);
CREATE INDEX idx_auth_audit_created ON auth_audit_log(created_at);

-- 파티셔닝 (월별)
CREATE TABLE auth_audit_log_partitioned (
    LIKE auth_audit_log INCLUDING ALL
) PARTITION BY RANGE (created_at);
```

---

## 9. 설정

### 9.1 application.yml

```yaml
server:
  port: 8081

spring:
  application:
    name: auth-service
    
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}

keycloak:
  auth-server-url: ${KEYCLOAK_URL:http://localhost:8180}
  realm: hr-saas
  client-id: hr-saas-api
  client-secret: ${KEYCLOAK_CLIENT_SECRET}
  admin:
    username: ${KEYCLOAK_ADMIN_USERNAME:admin}
    password: ${KEYCLOAK_ADMIN_PASSWORD:admin}

# Kafka
spring:
  kafka:
    bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer

# OpenTelemetry
management:
  tracing:
    sampling:
      probability: 1.0
  otlp:
    tracing:
      endpoint: ${OTEL_EXPORTER_OTLP_ENDPOINT:http://localhost:4317}
```

### 9.2 Kafka Events

```java
// 인증 관련 이벤트 정의
public class AuthEvents {

    @Value
    public static class UserCreatedEvent {
        String userId;
        String tenantId;
        String employeeId;
        List<String> roles;
        Instant timestamp;
    }

    @Value
    public static class UserLoggedInEvent {
        String userId;
        String tenantId;
        String ipAddress;
        Instant timestamp;
    }

    @Value
    public static class UserLoggedOutEvent {
        String userId;
        String tenantId;
        Instant timestamp;
    }

    @Value
    public static class PasswordChangedEvent {
        String userId;
        String tenantId;
        Instant timestamp;
    }

    @Value
    public static class RolesUpdatedEvent {
        String userId;
        String tenantId;
        List<String> oldRoles;
        List<String> newRoles;
        Instant timestamp;
    }
}
```

---

## 변경 이력

| 버전 | 일자 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2025-02-03 | - | 최초 작성 |

---

**문서 끝**