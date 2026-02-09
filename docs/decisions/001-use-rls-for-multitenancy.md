# ADR-001: 멀티테넌시에 PostgreSQL RLS 사용

> **상태**: 수락됨
> **날짜**: 2025-02
> **관련 ADR**: 없음

---

## 컨텍스트

HR SaaS 플랫폼은 100개 이상의 계열사(테넌트)가 동시에 사용하며, 각 테넌트의 데이터는 엄격하게 격리되어야 합니다. 개인정보보호법(PIPA)과 ISMS-P 인증 요건상 테넌트 간 데이터 누출은 절대 허용되지 않습니다.

### 요구사항

- 100+ 테넌트의 데이터 격리
- 애플리케이션 코드 실수로 인한 데이터 누출 방지
- 단일 DB로 운영 비용 최소화
- 테넌트 수 증가에 따른 스키마/인프라 변경 불필요
- ISMS-P 감사 시 격리 메커니즘 증명 가능

---

## 고려한 대안

### 대안 1: Database-per-Tenant (테넌트별 데이터베이스)

각 테넌트마다 별도의 PostgreSQL 인스턴스를 운영합니다.

- **장점**:
  - 물리적 완전 격리 (최고 보안 수준)
  - 테넌트별 독립적인 백업/복구
  - 성능 간섭 없음
- **단점**:
  - 100+ 인스턴스 운영 비용 (RDS 비용만 월 $10,000+)
  - 연결 관리 복잡도 (커넥션 풀 × 100)
  - 스키마 마이그레이션 100회 반복 필요
  - 계열사 간 통합 조회 시 교차 DB 쿼리 필요

### 대안 2: Schema-per-Tenant (테넌트별 스키마)

단일 DB 내에 테넌트별 스키마를 생성합니다 (예: `tenant_tech.employees`).

- **장점**:
  - 논리적 격리 (단일 DB)
  - 테넌트별 독립적인 마이그레이션 가능
  - 비용 효율적
- **단점**:
  - 스키마 수 × 테이블 수만큼 DB 메타데이터 증가 (100 스키마 × 50 테이블 = 5,000 테이블)
  - `search_path` 전환 오류 시 데이터 누출 위험
  - Flyway 마이그레이션 스키마별 실행 필요
  - JPA Entity 매핑이 복잡 (동적 스키마)

### 대안 3: Shared Schema + RLS (공유 스키마 + Row Level Security)

단일 DB, 단일 스키마에서 `tenant_id` 컬럼과 PostgreSQL RLS 정책으로 격리합니다.

- **장점**:
  - 가장 낮은 운영 비용 (단일 RDS)
  - 단순한 스키마 구조
  - Flyway 마이그레이션 1회 실행
  - DB 수준 강제 격리 (애플리케이션 코드 실수 방지)
  - 통합 조회 용이 (SUPER_ADMIN)
- **단점**:
  - 인덱스 효율 (모든 쿼리에 `tenant_id` 조건 추가)
  - 대용량 데이터 시 파티셔닝 필요할 수 있음
  - RLS 정책 관리 복잡도
  - `SET app.current_tenant` 설정 누락 시 빈 결과 반환

---

## 결정

**대안 3: Shared Schema + PostgreSQL RLS**를 선택합니다.

### 결정 근거

1. **비용 효율성**: 단일 RDS Multi-AZ 인스턴스로 100+ 테넌트 지원 (월 ~$200 vs $10,000+)
2. **DB 수준 격리**: 애플리케이션 코드에서 `WHERE tenant_id = ?`를 빠뜨려도 RLS가 자동 필터링
3. **운영 단순성**: Flyway 마이그레이션 1회, 백업/복구 1회
4. **감사 증명**: RLS 정책 자체가 격리 증명 (ISMS-P)
5. **통합 관리**: SUPER_ADMIN은 `BYPASSRLS` 권한으로 전체 조회 가능

### 구현 방식

```
요청 흐름:
HTTP Request (X-Tenant-Id 헤더)
  → TenantFilter (TenantContext 설정)
    → TenantConnectionInterceptor (SET app.current_tenant)
      → RLS 정책 자동 적용
        → 해당 테넌트 데이터만 반환
```

---

## 결과

### 긍정적 결과

- 13개 마이크로서비스에 일관된 패턴 적용 완료
- `TenantAwareEntity` 상속만으로 자동 tenant_id 주입
- Flyway V3/V4로 RLS 정책 표준 마이그레이션
- 비용: 단일 RDS db.r6g.large ($200/월) 로 100+ 테넌트 운영

### 부정적 결과 / 트레이드오프

- 모든 테이블에 `tenant_id` 컬럼 필수 (auth 관련 제외)
- 모든 인덱스에 `tenant_id` 포함 필요 (복합 인덱스)
- 비동기 이벤트 처리 시 `TenantContext` 수동 설정 필요
- 대용량 데이터 시 파티셔닝 전략 추가 필요할 수 있음

### 향후 고려사항

- 특정 테넌트의 데이터가 극단적으로 클 경우 테이블 파티셔닝 검토
- 성능 모니터링 통해 인덱스 전략 최적화
- 대용량 테넌트 분리 수요 발생 시 Database-per-Tenant 하이브리드 고려

---

## 관련 문서

| 문서 | 설명 |
|------|------|
| [MULTI_TENANCY.md](../architecture/MULTI_TENANCY.md) | RLS 구현 상세 가이드 |
| [DATABASE_PATTERNS.md](../architecture/DATABASE_PATTERNS.md) | Flyway V3/V4 마이그레이션 패턴 |
| [SECURITY_COMPLIANCE.md](../operations/SECURITY_COMPLIANCE.md) | ISMS-P 접근 제어 요건 매핑 |
