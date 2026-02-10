# HR Platform 개발 현황 (통합)

> **최종 업데이트**: 2026-02-10
> **통합 대상**: `deprecated/CURRENT_STATUS.md` + `deprecated/CURRENT_STATUS_BACKEND.md`

---

## 1. 프로젝트 개요

Enterprise-grade 멀티테넌트 HR SaaS 플랫폼 (100+ 계열사 지원)

---

## 2. 개발 진행률

| 영역 | 완료 | 전체 | 진행률 |
|------|------|------|--------|
| 백엔드 서비스 | 13 | 13 | 100% |
| 프론트엔드 Features | 23 | 23 | 100% |
| 프론트엔드 Pages | 61 | 61 | 100% |
| MSW Mock Handlers | 22 | 22 | 100% |
| Shared Types | 16 | 16 | 100% |
| E2E 테스트 | 7 | 10+ | 70% |
| AWS 인프라 | 2 | 10 | 20% |

---

## 3. 백엔드 서비스 현황 (13개)

| 서비스 | 포트 | RLS | Permission | Privacy | Flyway | HikariCP | 상태 |
|--------|------|:---:|:----------:|:-------:|:------:|:--------:|------|
| gateway-service | 8080 | N/A | N/A | N/A | N/A | N/A | 완료 |
| auth-service | 8081 | N/A | N/A | N/A | N/A | 20 | 완료 |
| tenant-service | 8082 | O | O | O | V1-V4 | 10 | 완료 |
| organization-service | 8083 | O | O | - | V1-V4 | 20 | 완료 |
| employee-service | 8084 | O | O | O | V1-V4 | 20 | 완료 |
| attendance-service | 8085 | O | O | - | V1-V4 | - | 완료 |
| approval-service | 8086 | O | O | - | V1-V4 | - | 완료 |
| mdm-service | 8087 | O | O | - | V1-V4 | 10 | 완료 |
| notification-service | 8088 | O | O | - | V1-V4 | - | 완료 |
| file-service | 8089 | O | O | - | V1-V4 | - | 완료 |
| appointment-service | 8091 | O | O | O | V1-V4 | 15 | 완료 |
| certificate-service | 8092 | O | O | O | V1-V4 | 5 | 완료 |
| recruitment-service | 8093 | O | O | O | V1-V4 | 5 | 완료 |

---

## 4. 완료된 백엔드 개발 단계

### Phase 1: 기본 인프라 (100%)
- Docker Compose 환경 구성 (PostgreSQL, Redis, LocalStack)
- Common 모듈 9개 구현
- 기본 서비스 10개 스캐폴딩

### Phase 2: RLS + Permission (100%)
- Flyway 마이그레이션 (V1-V4) 전체 서비스 적용
- PostgreSQL Row Level Security 정책 생성
- `@EnableMethodSecurity` 전체 서비스 활성화
- `@PreAuthorize` 전체 컨트롤러 적용 (150+ 메서드)

### Phase 3: Privacy Masking (100%)
- `MaskedFieldSerializer` 구현
- `PrivacyContext`, `PrivacyFilter` 구현
- `@Masked` 어노테이션 Entity/DTO 적용
- 역할 기반 마스킹 (HR_ADMIN 이상은 원본)

### Phase 4: Common Module Tests (100%)
- common-core, common-response, common-tenant 테스트
- common-security, common-privacy 테스트

### 성능 최적화 Phase 1: HikariCP (완료)
- 서비스별 차등 커넥션 풀 (5/10/15/20)
- 트랜잭션 전파 수정 (EmployeeCreatedCardListener)

### 성능 최적화 Phase 3: 캐싱 (완료)
- 테넌트 격리 캐싱 구현
- 직렬화 문제 수정

### PRD 현행화 (100% - 2026-02-10)
- 전 12개 서비스 모듈 문서 v2.0 업그레이드 완료
- Phase A (Gap 분석): PRD vs 코드 비교표, 코드 역분석, 미구현 Gap 목록, 로드맵
- Phase B (비즈니스 규칙): 상태 머신 Mermaid, 유효성 규칙, 계산 공식, 엣지 케이스
- Phase C (서비스 연동): 연동 아키텍처, Feign Client, SNS/SQS 이벤트, 통합 테스트 시나리오
- 추적성 매트릭스 동기화: 128 FR 중 102 완전 구현 (80%)
- 상세: `docs/modules/01~12-*-SERVICE.md`, `docs/requirements/TRACEABILITY_MATRIX.md`

---

## 5. 프론트엔드 현황

### Feature 모듈 (23개) - 전체 완료

auth, dashboard, employee, organization, attendance, approval, recruitment, appointment, certificate, tenant, mdm, notification, my-info, settings, audit, announcement, help, transfer, headcount, condolence, committee, employee-card, error

### 주요 페이지 (61+개) - 전체 완료

- 인증 (2), 대시보드 (1), 인사정보 (5), 조직관리 (5)
- 발령관리 (3), 근태/휴가 (7), 전자결재 (9), 채용관리 (7)
- 증명서 (4), 테넌트 관리 (3), 기준정보 (3), P2 기능 (8), 기타 (12)

---

## 6. 인증 및 권한

### 테스트 계정 (8개)

| 역할 | 계정 | 비밀번호 |
|------|------|----------|
| 시스템 관리자 | admin | admin1234 |
| 그룹 HR 총괄 | group | group1234 |
| 테넌트 관리자 | tenant | tenant1234 |
| HR 관리자 | hradmin | hradmin1234 |
| HR 담당자 | hr | hr1234 |
| 부서장 | deptmgr | deptmgr1234 |
| 팀장 | teamlead | teamlead1234 |
| 일반 직원 | employee | employee1234 |

### 테넌트 (5개)

| 테넌트 | 코드 | 접근 계정 |
|--------|------|----------|
| HR그룹 지주회사 | HOLDINGS | admin, group |
| HR테크 | TECH | 전체 |
| HR컨설팅 | CONSULTING | admin, group |
| HR아카데미 | ACADEMY | admin, group |
| HR파트너스 | PARTNERS | admin, group |

---

## 6.1 FE ↔ BE 연동 현황 (Gap 분석 결과)

> **분석일**: 2026-02-10
> **방법**: FE 서비스 파일 TODO 마커 + BE 컨트롤러 교차 비교

### 연동 상태 요약

| 카테고리 | 건수 | 상태 |
|---------|------|------|
| FE TODO → BE 이미 구현 (stale TODO) | 10건 | ✅ TODO 제거 완료 |
| BE 미구현 엔드포인트 | 1건 | ✅ 구현 완료 |
| 응답 포맷 불일치 | 1건 | ✅ BE 표준화 완료 |
| 대시보드 통합 API | 9건 | ✅ 전체 구현 확인 |
| 페이지네이션 불일치 (소규모 데이터셋) | 4건 | ⏸ FE 래핑 유지 |
| Mock-Only 기능 | 3건 | ⏸ 후순위 |

### 상세

**Stale TODO 정리 (BE 이미 구현됨):**
- Notification: GET /{id}, DELETE /{id}, POST /bulk-delete, GET /settings, PUT /settings
- Attendance: GET /leaves/calendar, GET /statistics/work-hours, PUT /attendances/{id}
- Approval: POST /delegations/{id}/toggle-status
- Employee: POST /employees/{id}/resign/cancel

**신규 구현:**
- `PUT /api/v1/approvals/delegations/{id}` - 대결 규칙 수정 (approval-service)

**응답 포맷 표준화:**
- `GET /overtimes/my/total-hours` - BigDecimal → OvertimeSummaryResponse DTO 래핑

**페이지네이션 (FE 래핑 유지):**
- GET /mdm/code-groups, GET /committees, GET /headcounts/plans, GET /departments
- 소규모 데이터셋이라 List 반환 유지, FE에서 PageResponse 래핑

---

## 7. 미완료 작업

### 높은 우선순위
- [ ] AWS 인프라 완성 (ECS, RDS, ElastiCache 등)
- [ ] 서비스별 통합 테스트 (Testcontainers)

### 중간 우선순위
- [ ] Cache 표준화 (모든 서비스 CacheNames 사용)
- [ ] 이벤트 발행 확대 (조직/공통코드 변경)
- [ ] API 문서화 (Swagger 보완)

### 낮은 우선순위
- [ ] Audit Log 서비스 확장
- [ ] Batch Processing
- [ ] Report 서비스

---

## 8. 알려진 이슈

| 이슈 | 영향 | 상태 |
|------|------|------|
| Windows CRLF 경고 | 없음 | 무시 가능 |
| Flyway Baseline 필요 (기존 DB) | 초기 설정 시 | 문서화됨 |
| 일부 테스트 컴파일 에러 (기존) | CI만 | Phase 1 이전부터 존재 |
| Notification 메일 서버 미설정 | 알림 발송 불가 | Mock 유지 |
| File S3 연동 미완성 | 파일 업로드 불가 | Mock 유지 |

---

## 9. 기술 스택

상세 내용: [docs/architecture/TECH_STACK.md](../architecture/TECH_STACK.md)

### 백엔드
Java 17, Spring Boot 3.2, Spring Cloud 2023.x, PostgreSQL 15 + RLS, Redis 7.x, AWS SQS/SNS, Custom JWT, Gradle 8.x

### 프론트엔드
React 18, TypeScript 5.x, Vite, TanStack Query, Zustand, Tailwind CSS, shadcn/ui, MSW, pnpm

---

## 10. 실행 방법

```bash
# 인프라 시작
cd docker && docker compose up -d

# 백엔드 빌드
./gradlew build

# 특정 서비스 실행
./gradlew :services:employee-service:bootRun

# 프론트엔드 실행
cd frontend/apps/web && pnpm install && pnpm dev
```

상세 설정: [docs/operations/LOCAL_DEVELOPMENT.md](../operations/LOCAL_DEVELOPMENT.md)
