# Login Test JSON Files

테스트용 로그인 JSON 파일 모음입니다.

## 사용법

```bash
# CEO 로그인
curl -X POST "http://localhost:18080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d @test-logins/login-ceo.json

# HR 관리자 로그인
curl -X POST "http://localhost:18080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d @test-logins/login-hr-admin.json

# 개발팀 관리자 로그인
curl -X POST "http://localhost:18080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d @test-logins/login-dev-manager.json

# 개발팀 직원 로그인
curl -X POST "http://localhost:18080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d @test-logins/login-dev-staff.json

# 슈퍼관리자 로그인
curl -X POST "http://localhost:18080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d @test-logins/login-superadmin.json
```

## 계정 정보

| 계정 | Username | 역할 | 권한 |
|------|----------|------|------|
| 슈퍼관리자 | superadmin | SUPER_ADMIN | 모든 권한 (*) |
| CEO | ceo.elec | TENANT_ADMIN | 모든 권한 (*) |
| HR 관리자 | hr.admin.elec | HR_MANAGER | 인사 전체 권한 |
| 개발팀 관리자 | dev.manager.elec | MANAGER | 부서 관리 권한 |
| 개발팀 직원 | dev.staff.elec | EMPLOYEE | 본인 정보 조회/수정 |

## 응답 예시

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzM4NCJ9...",
    "refreshToken": "eyJhbGciOiJIUzM4NCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 1800,
    "refreshExpiresIn": 604800,
    "passwordExpired": false,
    "passwordExpiresInDays": 45,
    "mfaRequired": false
  },
  "timestamp": "2026-02-11T05:18:06.377964599Z"
}
```
