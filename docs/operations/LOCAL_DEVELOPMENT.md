# 로컬 개발 환경 설정 가이드

> **최종 업데이트**: 2026-02-09
> **대상**: 신규 개발자, 백엔드/프론트엔드 개발자

---

## 목차

- [1. 사전 준비](#1-사전-준비)
- [2. IDE 설정](#2-ide-설정)
- [3. 백엔드 개발](#3-백엔드-개발)
- [4. 프론트엔드 개발](#4-프론트엔드-개발)
- [5. 데이터베이스 도구](#5-데이터베이스-도구)
- [6. Redis 관리](#6-redis-관리)
- [7. LocalStack (SNS/SQS)](#7-localstack-snssqs)
- [8. 디버깅 팁](#8-디버깅-팁)
- [9. 자주 묻는 질문 (FAQ)](#9-자주-묻는-질문-faq)
- [10. 관련 문서](#10-관련-문서)

---

## 1. 사전 준비

### 필수 소프트웨어

| 소프트웨어 | 버전 | 설치 |
|-----------|------|------|
| JDK | 17 | Amazon Corretto 17 권장 |
| Docker Desktop | 4.25+ | https://www.docker.com/products/docker-desktop |
| Git | 2.x+ | https://git-scm.com |
| Node.js | 18+ | https://nodejs.org |
| pnpm | 8+ | `npm install -g pnpm` |

### 프로젝트 클론

```bash
git clone https://github.com/sunguk0810/hr-platform.git
cd hr-platform
```

### 인프라 시작

```bash
cd docker
docker compose up -d postgres redis localstack jaeger prometheus grafana traefik
```

> Docker Desktop에서 최소 8GB 메모리를 할당하세요.

---

## 2. IDE 설정

### IntelliJ IDEA (권장)

#### 프로젝트 열기

1. File > Open > 프로젝트 루트 디렉토리 선택
2. "Import as Gradle project" 선택
3. JDK 17 선택

#### Lombok 플러그인

1. Settings > Plugins > "Lombok" 검색 후 설치
2. Settings > Build > Compiler > Annotation Processors > "Enable annotation processing" 체크

#### 실행 구성 (Run Configuration)

각 서비스별 Spring Boot Run Configuration:

- **Main class**: `com.hrsaas.{service}.{Service}Application`
- **Active profiles**: `dev`
- **Environment variables**:
  ```
  DB_HOST=localhost;DB_PORT=15432;REDIS_HOST=localhost;REDIS_PORT=16379;REDIS_PASSWORD=redis_password
  ```

#### 유용한 설정

- Settings > Editor > Code Style > Java > Import > "Google Java Style" 적용
- Settings > Build > Gradle > "Build and run using" = IntelliJ IDEA (빌드 속도 향상)

### VS Code

#### 필수 확장 프로그램

- **Extension Pack for Java** (Microsoft)
- **Spring Boot Extension Pack** (VMware)
- **Gradle for Java** (Microsoft)
- **Docker** (Microsoft)

#### settings.json

```json
{
  "java.configuration.runtimes": [
    {
      "name": "JavaSE-17",
      "path": "/path/to/jdk-17",
      "default": true
    }
  ],
  "java.import.gradle.wrapper.enabled": true
}
```

---

## 3. 백엔드 개발

### 서비스 실행

```bash
# 인프라 시작 (Docker)
cd docker && docker compose up -d postgres redis localstack

# 특정 서비스 실행 (Gradle)
./gradlew :services:auth-service:bootRun
./gradlew :services:employee-service:bootRun
```

### 빌드 및 테스트

```bash
# 전체 빌드
./gradlew build

# 테스트 제외 빌드
./gradlew build -x test

# 특정 서비스 테스트
./gradlew :services:employee-service:test

# 특정 테스트 클래스
./gradlew :services:employee-service:test --tests "*EmployeeServiceTest"

# 커버리지 리포트
./gradlew jacocoTestReport
# 리포트 위치: {service}/build/reports/jacoco/test/html/index.html
```

### 테스트 계정

| 역할 | 계정 | 비밀번호 | 접근 범위 |
|------|------|----------|----------|
| 시스템 관리자 | admin | admin1234 | 전체 |
| 그룹 HR 총괄 | group | group1234 | 전체 |
| 테넌트 관리자 | tenant | tenant1234 | 단일 테넌트 |
| HR 관리자 | hradmin | hradmin1234 | HR 기능 전체 |
| HR 담당자 | hr | hr1234 | HR 기능 (제한) |
| 부서장 | deptmgr | deptmgr1234 | 부서 결재 |
| 팀장 | teamlead | teamlead1234 | 팀 결재 |
| 일반 직원 | employee | employee1234 | 본인 정보 |

### API 테스트

```bash
# 로그인 (JWT 토큰 획득)
curl -X POST http://localhost:8081/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin1234"}'

# 직원 목록 조회
curl http://localhost:8084/api/v1/employees \
  -H "Authorization: Bearer {access_token}" \
  -H "X-Tenant-Id: {tenant_id}"
```

---

## 4. 프론트엔드 개발

> **중요**: 프론트엔드 패키지 관리는 반드시 `pnpm`을 사용하세요.

### 설정 및 실행

```bash
cd frontend
pnpm install

cd apps/web
pnpm dev
# http://localhost:5173
```

### 빌드

```bash
cd frontend/apps/web
pnpm build
pnpm preview  # 프로덕션 빌드 확인
```

### MSW (Mock Service Worker)

프론트엔드는 백엔드 없이도 MSW로 개발 가능합니다:

- MSW 핸들러: `frontend/apps/web/src/mocks/handlers/`
- 22개 Mock 핸들러, 318개 엔드포인트 지원
- 개발 서버 시작 시 자동 활성화

---

## 5. 데이터베이스 도구

### CLI 접속

```bash
docker exec -it hr-saas-postgres psql -U hr_saas -d hr_saas
```

### GUI 도구 연결 설정

| 항목 | 값 |
|------|------|
| Host | `localhost` |
| Port | `15432` |
| Database | `hr_saas` |
| Username | `hr_saas` |
| Password | `hr_saas_password` |

권장 GUI 도구:
- **DBeaver** (무료, 크로스 플랫폼)
- **DataGrip** (JetBrains, IntelliJ 통합)
- **pgAdmin 4** (웹 기반)

### 유용한 SQL

```sql
-- 스키마 목록
\dn

-- 특정 스키마 테이블 목록
\dt hr_core.*

-- RLS 정책 확인
SELECT * FROM pg_policies WHERE schemaname = 'hr_core';

-- 현재 커넥션 수
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Flyway 마이그레이션 이력
SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 10;
```

---

## 6. Redis 관리

### CLI 접속

```bash
docker exec -it hr-saas-redis redis-cli -a redis_password
```

### 유용한 명령

```bash
PING                     # 연결 확인
KEYS *                   # 전체 키 (개발만)
KEYS employee:*          # 특정 패턴
GET {key}                # 값 조회
TTL {key}                # 남은 TTL
DEL {key}                # 키 삭제
FLUSHALL                 # 전체 삭제 (주의!)
INFO memory              # 메모리 사용량
DBSIZE                   # 총 키 수
```

---

## 7. LocalStack (SNS/SQS)

### 토픽/큐 확인

```bash
# SNS 토픽 목록
docker exec hr-saas-localstack awslocal sns list-topics

# SQS 큐 목록
docker exec hr-saas-localstack awslocal sqs list-queues

# 큐 메시지 수 확인
docker exec hr-saas-localstack awslocal sqs get-queue-attributes \
  --queue-url http://localhost:14566/000000000000/notification-service-queue \
  --attribute-names ApproximateNumberOfMessages

# 수동 메시지 발행 (테스트)
docker exec hr-saas-localstack awslocal sns publish \
  --topic-arn arn:aws:sns:ap-northeast-2:000000000000:employee-created \
  --message '{"eventType":"EmployeeCreated","tenantId":"..."}'
```

---

## 8. 디버깅 팁

### Spring Boot 원격 디버그

```bash
# Gradle로 디버그 모드 실행
./gradlew :services:employee-service:bootRun --debug-jvm
# IntelliJ에서 Remote JVM Debug (Port 5005) 연결
```

### SQL 로그 활성화

```yaml
# application-dev.yml
logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```

### 403 Forbidden 디버깅

1. JWT 토큰이 유효한지 확인 (jwt.io에서 디코딩)
2. 토큰에 올바른 `roles` 포함 확인
3. `SecurityConfig`에 `FilterRegistrationBean` 있는지 확인
4. 상세 내용: [SECURITY_PATTERNS.md](../architecture/SECURITY_PATTERNS.md)

---

## 9. 자주 묻는 질문 (FAQ)

### Q: Docker 메모리 부족으로 서비스가 죽어요

A: Docker Desktop에서 메모리를 12GB 이상으로 설정하세요. 또는 필요한 서비스만 실행하세요:

```bash
docker compose up -d postgres redis localstack
```

### Q: PostgreSQL 포트가 15432인 이유는?

A: 로컬에 설치된 PostgreSQL(5432)과 충돌 방지. Redis도 같은 이유로 16379 사용.

### Q: Flyway 마이그레이션 에러가 발생해요

A: `./gradlew :services:{서비스}:flywayBaseline` 후 재시도. 상세: [DATABASE_PATTERNS.md](../architecture/DATABASE_PATTERNS.md)

### Q: 프론트엔드에서 npm 대신 pnpm을 사용하는 이유는?

A: Turborepo 모노레포 구조에서 pnpm의 워크스페이스 관리가 더 효율적입니다.

---

## 10. 관련 문서

| 문서 | 설명 |
|------|------|
| [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) | Docker Compose 전체 설정 상세 |
| [SECURITY_PATTERNS.md](../architecture/SECURITY_PATTERNS.md) | 인증/권한 트러블슈팅 |
| [DATABASE_PATTERNS.md](../architecture/DATABASE_PATTERNS.md) | DB 연결/마이그레이션 |
| [CACHING_STRATEGY.md](../architecture/CACHING_STRATEGY.md) | Redis 캐시 |
