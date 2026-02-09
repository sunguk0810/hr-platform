# HR Platform API 컨벤션

## 목차
1. [REST API 설계 원칙](#1-rest-api-설계-원칙)
2. [URL 명명 규칙](#2-url-명명-규칙)
3. [HTTP 메서드 사용](#3-http-메서드-사용)
4. [요청/응답 형식](#4-요청응답-형식)
5. [에러 코드 체계](#5-에러-코드-체계)
6. [인증 및 보안](#6-인증-및-보안)
7. [페이지네이션](#7-페이지네이션)
8. [버전 관리](#8-버전-관리)

---

## 1. REST API 설계 원칙

### 1.1 기본 원칙
- **리소스 중심**: URL은 리소스(명사)를 표현
- **행위는 HTTP 메서드로**: GET, POST, PUT, PATCH, DELETE
- **일관성 유지**: 모든 API는 동일한 패턴 준수
- **상태 코드 활용**: 적절한 HTTP 상태 코드 반환

### 1.2 API 기본 구조
```
https://{domain}/api/v{version}/{resource}
```

예시:
```
https://api.hrplatform.com/api/v1/employees
https://api.hrplatform.com/api/v1/departments
https://api.hrplatform.com/api/v1/approvals
```

---

## 2. URL 명명 규칙

### 2.1 기본 규칙
| 규칙 | 예시 |
|------|------|
| 소문자 사용 | `/employees` (O), `/Employees` (X) |
| 복수형 사용 | `/employees` (O), `/employee` (X) |
| 하이픈(-) 사용 | `/employee-transfers` (O), `/employee_transfers` (X) |
| 동사 사용 금지 | `/employees` (O), `/getEmployees` (X) |
| 파일 확장자 금지 | `/employees` (O), `/employees.json` (X) |

### 2.2 리소스 계층 구조
```
# 컬렉션
GET /api/v1/employees

# 단일 리소스
GET /api/v1/employees/{id}

# 하위 리소스
GET /api/v1/employees/{id}/career-histories
GET /api/v1/departments/{id}/employees

# 3단계 이하 권장
GET /api/v1/departments/{deptId}/employees/{empId}/career-histories
```

### 2.3 서비스별 API 경로

| 서비스 | Base Path | 예시 |
|--------|-----------|------|
| Auth | `/api/v1/auth` | `/api/v1/auth/login`, `/api/v1/auth/token/refresh` |
| Tenant | `/api/v1/tenants` | `/api/v1/tenants/{id}`, `/api/v1/tenants/{id}/policies` |
| MDM | `/api/v1/mdm` | `/api/v1/mdm/code-groups`, `/api/v1/mdm/common-codes` |
| Organization | `/api/v1/organizations` | `/api/v1/organizations/{id}/departments` |
| Employee | `/api/v1/employees` | `/api/v1/employees/{id}`, `/api/v1/employees/{id}/families` |
| Approval | `/api/v1/approvals` | `/api/v1/approvals/{id}`, `/api/v1/approvals/{id}/approve` |
| Attendance | `/api/v1/attendances` | `/api/v1/attendances`, `/api/v1/leaves` |
| Notification | `/api/v1/notifications` | `/api/v1/notifications`, `/api/v1/notifications/{id}/read` |
| File | `/api/v1/files` | `/api/v1/files/upload`, `/api/v1/files/{id}/download` |

### 2.4 특수 동작 URL

리소스의 상태 변경이나 특수 동작은 하위 경로로 표현:

```
# 상태 변경
POST /api/v1/employees/{id}/activate
POST /api/v1/employees/{id}/deactivate
POST /api/v1/employees/{id}/retire

# 결재 동작
POST /api/v1/approvals/{id}/submit       # 제출
POST /api/v1/approvals/{id}/approve      # 승인
POST /api/v1/approvals/{id}/reject       # 반려
POST /api/v1/approvals/{id}/cancel       # 취소

# 파일 동작
POST /api/v1/files/upload
GET  /api/v1/files/{id}/download
POST /api/v1/files/{id}/copy
```

### 2.5 검색 및 필터링

```
# 쿼리 파라미터 사용
GET /api/v1/employees?name=홍길동
GET /api/v1/employees?departmentId=1&status=ACTIVE
GET /api/v1/employees?hireDate.from=2024-01-01&hireDate.to=2024-12-31

# 정렬
GET /api/v1/employees?sort=name,asc
GET /api/v1/employees?sort=hireDate,desc&sort=name,asc

# 복합 검색
GET /api/v1/employees?q=홍길동&departmentId=1&status=ACTIVE&sort=hireDate,desc
```

---

## 3. HTTP 메서드 사용

### 3.1 메서드별 용도

| 메서드 | 용도 | 멱등성 | 안전성 |
|--------|------|--------|--------|
| GET | 리소스 조회 | O | O |
| POST | 리소스 생성 | X | X |
| PUT | 리소스 전체 수정 | O | X |
| PATCH | 리소스 부분 수정 | X | X |
| DELETE | 리소스 삭제 | O | X |

### 3.2 상세 가이드

#### GET - 조회
```http
# 목록 조회
GET /api/v1/employees
GET /api/v1/employees?page=0&size=20

# 단건 조회
GET /api/v1/employees/123

# 하위 리소스 조회
GET /api/v1/employees/123/career-histories
```

#### POST - 생성
```http
POST /api/v1/employees
Content-Type: application/json

{
  "employeeNumber": "EMP001",
  "name": "홍길동",
  "departmentId": 1
}
```

#### PUT - 전체 수정
```http
PUT /api/v1/employees/123
Content-Type: application/json

{
  "employeeNumber": "EMP001",
  "name": "홍길동",
  "email": "hong@example.com",
  "departmentId": 2,
  "positionId": 3
}
```

#### PATCH - 부분 수정
```http
PATCH /api/v1/employees/123
Content-Type: application/json

{
  "departmentId": 2
}
```

#### DELETE - 삭제
```http
DELETE /api/v1/employees/123
```

### 3.3 HTTP 상태 코드

#### 성공 응답 (2xx)
| 코드 | 용도 | 사용 예시 |
|------|------|----------|
| 200 OK | 일반 성공 | GET, PUT, PATCH 성공 |
| 201 Created | 생성 성공 | POST로 리소스 생성 |
| 204 No Content | 성공 (본문 없음) | DELETE 성공 |

#### 클라이언트 오류 (4xx)
| 코드 | 용도 | 사용 예시 |
|------|------|----------|
| 400 Bad Request | 잘못된 요청 | 유효성 검증 실패 |
| 401 Unauthorized | 인증 필요 | 토큰 없음/만료 |
| 403 Forbidden | 권한 없음 | 접근 권한 부족 |
| 404 Not Found | 리소스 없음 | 존재하지 않는 ID |
| 409 Conflict | 충돌 | 중복 데이터 |
| 422 Unprocessable Entity | 처리 불가 | 비즈니스 규칙 위반 |
| 429 Too Many Requests | 요청 과다 | Rate Limit 초과 |

#### 서버 오류 (5xx)
| 코드 | 용도 | 사용 예시 |
|------|------|----------|
| 500 Internal Server Error | 서버 오류 | 예상치 못한 오류 |
| 502 Bad Gateway | 게이트웨이 오류 | 외부 서비스 연결 실패 |
| 503 Service Unavailable | 서비스 불가 | 서버 과부하 |
| 504 Gateway Timeout | 타임아웃 | 외부 서비스 응답 지연 |

---

## 4. 요청/응답 형식

### 4.1 공통 응답 구조

#### 성공 응답
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 단건 조회 응답
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "id": 123,
    "employeeNumber": "EMP001",
    "name": "홍길동",
    "email": "hong@example.com",
    "department": {
      "id": 1,
      "name": "개발팀"
    },
    "status": "ACTIVE",
    "createdAt": "2024-01-01T09:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 목록 조회 응답 (페이지네이션)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "content": [
      { "id": 1, "name": "홍길동", ... },
      { "id": 2, "name": "김철수", ... }
    ],
    "page": {
      "number": 0,
      "size": 20,
      "totalElements": 150,
      "totalPages": 8,
      "first": true,
      "last": false
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 에러 응답
```json
{
  "success": false,
  "code": "EMPLOYEE_NOT_FOUND",
  "message": "직원을 찾을 수 없습니다.",
  "data": null,
  "errors": [
    {
      "field": "id",
      "value": "999",
      "reason": "해당 ID의 직원이 존재하지 않습니다."
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/employees/999",
  "traceId": "abc123def456"
}
```

#### 유효성 검증 에러 응답
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "입력값 검증에 실패했습니다.",
  "data": null,
  "errors": [
    {
      "field": "name",
      "value": "",
      "reason": "이름은 필수 입력값입니다."
    },
    {
      "field": "email",
      "value": "invalid-email",
      "reason": "올바른 이메일 형식이 아닙니다."
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/employees",
  "traceId": "abc123def456"
}
```

### 4.2 요청 형식

#### 생성 요청 (POST)
```json
{
  "employeeNumber": "EMP001",
  "name": "홍길동",
  "email": "hong@example.com",
  "departmentId": 1,
  "positionId": 2,
  "hireDate": "2024-01-15"
}
```

#### 수정 요청 (PUT/PATCH)
```json
{
  "name": "홍길동",
  "departmentId": 2
}
```

### 4.3 날짜/시간 형식

| 형식 | 용도 | 예시 |
|------|------|------|
| ISO 8601 (날짜) | 날짜만 | `2024-01-15` |
| ISO 8601 (시간) | 날짜+시간 (UTC) | `2024-01-15T10:30:00Z` |
| ISO 8601 (타임존) | 날짜+시간+타임존 | `2024-01-15T19:30:00+09:00` |

```java
// Java에서 처리
@JsonFormat(pattern = "yyyy-MM-dd")
private LocalDate hireDate;

@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
private Instant createdAt;
```

### 4.4 필드 네이밍

- **JSON**: camelCase 사용
- **Query Parameter**: camelCase 또는 dot notation

```json
{
  "employeeNumber": "EMP001",
  "firstName": "길동",
  "lastName": "홍",
  "hireDate": "2024-01-15",
  "departmentId": 1
}
```

```
GET /api/v1/employees?employeeNumber=EMP001
GET /api/v1/employees?hireDate.from=2024-01-01&hireDate.to=2024-12-31
```

---

## 5. 에러 코드 체계

### 5.1 에러 코드 명명 규칙

```
{DOMAIN}_{ERROR_TYPE}

예시:
- EMPLOYEE_NOT_FOUND
- DEPARTMENT_ALREADY_EXISTS
- APPROVAL_INVALID_STATUS
```

### 5.2 공통 에러 코드

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| `SUCCESS` | 200 | 성공 |
| `CREATED` | 201 | 생성 성공 |
| `VALIDATION_ERROR` | 400 | 유효성 검증 실패 |
| `INVALID_REQUEST` | 400 | 잘못된 요청 |
| `UNAUTHORIZED` | 401 | 인증 필요 |
| `TOKEN_EXPIRED` | 401 | 토큰 만료 |
| `TOKEN_INVALID` | 401 | 유효하지 않은 토큰 |
| `ACCESS_DENIED` | 403 | 접근 권한 없음 |
| `RESOURCE_NOT_FOUND` | 404 | 리소스 없음 |
| `METHOD_NOT_ALLOWED` | 405 | 허용되지 않은 메서드 |
| `CONFLICT` | 409 | 리소스 충돌 |
| `RATE_LIMIT_EXCEEDED` | 429 | 요청 한도 초과 |
| `INTERNAL_SERVER_ERROR` | 500 | 서버 내부 오류 |
| `SERVICE_UNAVAILABLE` | 503 | 서비스 이용 불가 |

### 5.3 도메인별 에러 코드

#### Auth Service (AUTH_xxx)
| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| `AUTH_LOGIN_FAILED` | 401 | 로그인 실패 |
| `AUTH_ACCOUNT_LOCKED` | 401 | 계정 잠김 |
| `AUTH_ACCOUNT_DISABLED` | 401 | 계정 비활성화 |
| `AUTH_SESSION_EXPIRED` | 401 | 세션 만료 |
| `AUTH_MFA_REQUIRED` | 401 | MFA 인증 필요 |

#### Tenant Service (TENANT_xxx)
| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| `TENANT_NOT_FOUND` | 404 | 테넌트 없음 |
| `TENANT_ALREADY_EXISTS` | 409 | 테넌트 중복 |
| `TENANT_DISABLED` | 403 | 비활성화된 테넌트 |
| `TENANT_QUOTA_EXCEEDED` | 403 | 테넌트 할당량 초과 |

#### Employee Service (EMPLOYEE_xxx)
| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| `EMPLOYEE_NOT_FOUND` | 404 | 직원 없음 |
| `EMPLOYEE_ALREADY_EXISTS` | 409 | 직원 중복 |
| `EMPLOYEE_NUMBER_DUPLICATE` | 409 | 사번 중복 |
| `EMPLOYEE_ALREADY_RETIRED` | 422 | 이미 퇴사한 직원 |
| `EMPLOYEE_TRANSFER_INVALID` | 422 | 유효하지 않은 인사이동 |

#### Department Service (DEPARTMENT_xxx)
| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| `DEPARTMENT_NOT_FOUND` | 404 | 부서 없음 |
| `DEPARTMENT_ALREADY_EXISTS` | 409 | 부서 중복 |
| `DEPARTMENT_HAS_EMPLOYEES` | 422 | 직원이 있는 부서 |
| `DEPARTMENT_CYCLE_DETECTED` | 422 | 부서 계층 순환 |

#### Approval Service (APPROVAL_xxx)
| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| `APPROVAL_NOT_FOUND` | 404 | 결재 문서 없음 |
| `APPROVAL_INVALID_STATUS` | 422 | 유효하지 않은 상태 |
| `APPROVAL_ALREADY_PROCESSED` | 422 | 이미 처리된 결재 |
| `APPROVAL_LINE_EMPTY` | 422 | 결재선 없음 |
| `APPROVAL_NOT_YOUR_TURN` | 403 | 결재 순서 아님 |
| `APPROVAL_UNAUTHORIZED` | 403 | 결재 권한 없음 |

#### Attendance Service (ATTENDANCE_xxx)
| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| `ATTENDANCE_ALREADY_CHECKED_IN` | 422 | 이미 출근 처리됨 |
| `ATTENDANCE_NOT_CHECKED_IN` | 422 | 출근 기록 없음 |
| `LEAVE_INSUFFICIENT_BALANCE` | 422 | 휴가 잔여일 부족 |
| `LEAVE_OVERLAP` | 422 | 휴가 기간 중복 |

#### MDM Service (MDM_xxx)
| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| `CODE_GROUP_NOT_FOUND` | 404 | 코드 그룹 없음 |
| `CODE_NOT_FOUND` | 404 | 공통코드 없음 |
| `CODE_ALREADY_EXISTS` | 409 | 공통코드 중복 |
| `CODE_IN_USE` | 422 | 사용 중인 코드 |

#### File Service (FILE_xxx)
| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| `FILE_NOT_FOUND` | 404 | 파일 없음 |
| `FILE_SIZE_EXCEEDED` | 400 | 파일 크기 초과 |
| `FILE_TYPE_NOT_ALLOWED` | 400 | 허용되지 않은 파일 형식 |
| `FILE_UPLOAD_FAILED` | 500 | 파일 업로드 실패 |

### 5.4 에러 코드 Java 구현

```java
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 공통
    SUCCESS("SUCCESS", HttpStatus.OK, "성공"),
    CREATED("CREATED", HttpStatus.CREATED, "생성 성공"),
    VALIDATION_ERROR("VALIDATION_ERROR", HttpStatus.BAD_REQUEST, "유효성 검증 실패"),
    INTERNAL_SERVER_ERROR("INTERNAL_SERVER_ERROR", HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류"),

    // 인증
    UNAUTHORIZED("UNAUTHORIZED", HttpStatus.UNAUTHORIZED, "인증이 필요합니다"),
    TOKEN_EXPIRED("TOKEN_EXPIRED", HttpStatus.UNAUTHORIZED, "토큰이 만료되었습니다"),
    ACCESS_DENIED("ACCESS_DENIED", HttpStatus.FORBIDDEN, "접근 권한이 없습니다"),

    // Employee
    EMPLOYEE_NOT_FOUND("EMPLOYEE_NOT_FOUND", HttpStatus.NOT_FOUND, "직원을 찾을 수 없습니다"),
    EMPLOYEE_NUMBER_DUPLICATE("EMPLOYEE_NUMBER_DUPLICATE", HttpStatus.CONFLICT, "이미 사용 중인 사번입니다"),
    EMPLOYEE_ALREADY_RETIRED("EMPLOYEE_ALREADY_RETIRED", HttpStatus.UNPROCESSABLE_ENTITY, "이미 퇴사한 직원입니다"),

    // Approval
    APPROVAL_NOT_FOUND("APPROVAL_NOT_FOUND", HttpStatus.NOT_FOUND, "결재 문서를 찾을 수 없습니다"),
    APPROVAL_INVALID_STATUS("APPROVAL_INVALID_STATUS", HttpStatus.UNPROCESSABLE_ENTITY, "유효하지 않은 결재 상태입니다"),
    APPROVAL_NOT_YOUR_TURN("APPROVAL_NOT_YOUR_TURN", HttpStatus.FORBIDDEN, "결재 순서가 아닙니다");

    private final String code;
    private final HttpStatus httpStatus;
    private final String defaultMessage;
}
```

---

## 6. 인증 및 보안

### 6.1 인증 헤더

```http
Authorization: Bearer {JWT_ACCESS_TOKEN}
X-Tenant-Id: {TENANT_UUID}
X-Request-Id: {UUID}  # 선택, 추적용
```

### 6.2 JWT 토큰 구조

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-uuid",
    "tenant_id": "tenant-uuid",
    "employee_id": "employee-uuid",
    "roles": ["ROLE_USER", "ROLE_MANAGER"],
    "permissions": ["employee:read", "employee:write"],
    "iat": 1705300000,
    "exp": 1705303600
  }
}
```

### 6.3 토큰 갱신

```http
POST /api/v1/auth/token/refresh
Content-Type: application/json

{
  "refreshToken": "eyJ..."
}

# 응답
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 3600
  }
}
```

### 6.4 권한 체크 헤더

Gateway에서 검증 후 전파되는 헤더:

```http
X-User-Id: {USER_UUID}
X-Tenant-Id: {TENANT_UUID}
X-Employee-Id: {EMPLOYEE_UUID}
X-User-Roles: ROLE_USER,ROLE_MANAGER
X-User-Permissions: employee:read,employee:write
```

---

## 7. 페이지네이션

### 7.1 요청 파라미터

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `page` | int | 0 | 페이지 번호 (0부터 시작) |
| `size` | int | 20 | 페이지 크기 (최대 100) |
| `sort` | string | - | 정렬 기준 |

```http
GET /api/v1/employees?page=0&size=20&sort=name,asc&sort=hireDate,desc
```

### 7.2 응답 구조

```json
{
  "success": true,
  "data": {
    "content": [...],
    "page": {
      "number": 0,
      "size": 20,
      "totalElements": 150,
      "totalPages": 8,
      "first": true,
      "last": false,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

### 7.3 커서 기반 페이지네이션

대용량 데이터의 경우 커서 기반 권장:

```http
GET /api/v1/notifications?cursor=abc123&size=20
```

```json
{
  "success": true,
  "data": {
    "content": [...],
    "cursor": {
      "next": "def456",
      "hasMore": true
    }
  }
}
```

---

## 8. 버전 관리

### 8.1 URL 버전 전략

```
/api/v1/employees    # 버전 1
/api/v2/employees    # 버전 2
```

### 8.2 버전 변경 가이드

| 변경 유형 | 버전 업 필요 | 예시 |
|----------|-------------|------|
| 필드 추가 | X | 응답에 새 필드 추가 |
| 선택 파라미터 추가 | X | 새 쿼리 파라미터 |
| 필드 제거 | O | 기존 필드 삭제 |
| 필드 타입 변경 | O | string → number |
| URL 구조 변경 | O | 경로 변경 |
| 필수 파라미터 추가 | O | 새 필수 필드 |

### 8.3 Deprecated 처리

```http
# 응답 헤더
Deprecation: true
Sunset: Sat, 31 Dec 2024 23:59:59 GMT
Link: </api/v2/employees>; rel="successor-version"
```

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "deprecated": true,
    "message": "This API version is deprecated. Please migrate to /api/v2/employees by 2024-12-31.",
    "successor": "/api/v2/employees"
  }
}
```

---

## 부록

### A. Swagger/OpenAPI 문서

각 서비스의 API 문서 접근:
```
http://localhost:{port}/swagger-ui.html
http://localhost:{port}/v3/api-docs
```

### B. cURL 예시

```bash
# 로그인
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 직원 목록 조회
curl -X GET "http://localhost:8080/api/v1/employees?page=0&size=10" \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-Id: {tenant-id}"

# 직원 생성
curl -X POST http://localhost:8080/api/v1/employees \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-Id: {tenant-id}" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeNumber": "EMP001",
    "name": "홍길동",
    "departmentId": 1
  }'
```

### C. Postman Collection

프로젝트 루트의 `/docs/postman` 디렉토리에 Postman Collection 파일 제공:
- `HR-Platform.postman_collection.json`
- `HR-Platform-Local.postman_environment.json`
- `HR-Platform-Dev.postman_environment.json`

### D. Rate Limiting

| 엔드포인트 | 제한 | 윈도우 |
|-----------|------|--------|
| 인증 API | 10 req | 1분 |
| 일반 API | 100 req | 1분 |
| 검색 API | 30 req | 1분 |
| 파일 업로드 | 10 req | 1분 |

초과 시 응답:
```json
{
  "success": false,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
  "data": {
    "retryAfter": 60
  }
}
```

### E. CORS 설정

허용된 오리진:
```
https://hrplatform.com
https://*.hrplatform.com
http://localhost:3000  # 개발 환경
```

허용된 헤더:
```
Authorization
Content-Type
X-Tenant-Id
X-Request-Id
```
