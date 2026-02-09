# ADR-004: 서비스별 HikariCP 풀 차등 사이징

> **상태**: 수락됨
> **날짜**: 2025-12
> **관련 ADR**: [ADR-001](001-use-rls-for-multitenancy.md) (RLS 멀티테넌시)

---

## 컨텍스트

13개 마이크로서비스가 단일 PostgreSQL 인스턴스를 공유하며, PostgreSQL의 `max_connections` 기본값은 100입니다. 모든 서비스가 HikariCP 기본 풀 크기(10)를 사용할 경우 이론적 최대 커넥션은 130개 (13 × 10)로, DB 커넥션 고갈 위험이 있습니다.

### 문제 상황

- 성능 테스트 중 `HikariPool - Connection is not available` 에러 발생
- 일부 서비스(employee, attendance)는 복잡한 조인 쿼리로 커넥션 점유 시간 긴 반면, 다른 서비스(certificate, recruitment)는 단순 CRUD
- 이벤트 리스너에서 `@Transactional` 중첩 호출 시 커넥션 2개 동시 점유 문제 발견

---

## 고려한 대안

### 대안 1: 균등 분배

모든 서비스에 동일한 풀 크기를 할당합니다 (예: 각 10개).

- **장점**:
  - 설정 단순
  - 서비스 간 공평
- **단점**:
  - 총 130개 → PostgreSQL max_connections=200 필요
  - 트래픽이 낮은 서비스에 과할당
  - 트래픽이 높은 서비스에 부족

### 대안 2: 서비스별 차등 사이징 (선택)

서비스의 트래픽 패턴과 쿼리 복잡도에 따라 풀 크기를 다르게 설정합니다.

- **장점**:
  - 리소스 효율적 할당
  - 총 커넥션 수 최적화
  - 서비스 특성 반영
- **단점**:
  - 설정 관리 복잡도 증가
  - 정기적인 튜닝 필요

### 대안 3: Database-per-Service

각 서비스에 별도 DB를 할당합니다.

- **장점**:
  - 완전한 격리
  - 커넥션 경합 없음
- **단점**:
  - RDS 비용 급증 (13개 인스턴스)
  - RLS 기반 멀티테넌시와 충돌
  - 운영 복잡도 급증

---

## 결정

**대안 2: 서비스별 차등 사이징**을 선택합니다.

### 사이징 기준

4단계 티어로 분류:

| 티어 | 풀 크기 | 기준 | 해당 서비스 |
|------|---------|------|------------|
| **높은 트래픽** | 20 | 복잡한 조인, 높은 동시성, 보고서 쿼리 | auth, organization, employee, attendance |
| **표준** | 10 | 일반적인 CRUD 패턴 | tenant, mdm |
| **배치 중심** | 15 | 배치 처리, 이벤트 소비 집중 | appointment, approval |
| **낮은 트래픽** | 5 | 단순 CRUD, 낮은 동시성 | certificate, recruitment, notification, file |

### 총 커넥션 계산

```
높은 트래픽: 4 × 20 = 80
표준:        2 × 10 = 20
배치 중심:   2 × 15 = 30  (approval 추가 포함 시)
낮은 트래픽: 4 × 5  = 20
──────────────────────────
합계:                = 150 (여유: PostgreSQL max_connections=200)
```

### PostgreSQL 설정

```ini
# postgresql.conf (또는 RDS Parameter Group)
max_connections = 200
shared_buffers = 256MB
```

### 추가 조치: 트랜잭션 전파 수정

이벤트 리스너에서 커넥션 2개 점유 문제 해결:

```java
// 수정 전: REQUIRED (기존 트랜잭션 참여 시도 → 별도 커넥션 획득)
@Transactional
public void handleEvent(DomainEvent event) { ... }

// 수정 후: REQUIRES_NEW (명시적 새 트랜잭션)
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void handleEvent(DomainEvent event) { ... }
```

---

## 결과

### 긍정적 결과

- 총 커넥션 수 최적화: 150개 (max_connections 200의 75%)
- `Connection is not available` 에러 해소
- 서비스별 리소스 효율적 배분
- 트랜잭션 전파 문제 해결 (REQUIRES_NEW)

### 부정적 결과 / 트레이드오프

- 서비스별 `application.yml`에 개별 설정 필요
- 트래픽 패턴 변화 시 재튜닝 필요
- 설정 누락 시 기본값(10)으로 동작 → 의도치 않은 커넥션 사용

### 모니터링

Prometheus + Grafana로 다음 메트릭을 모니터링:

```
hikaricp_connections_active      # 활성 커넥션 수
hikaricp_connections_idle         # 유휴 커넥션 수
hikaricp_connections_pending      # 대기 중 요청
hikaricp_connections_timeout_total # 타임아웃 횟수 (알림 설정)
```

### 향후 고려사항

- ECS Auto Scaling 시 서비스 인스턴스 수 × 풀 크기가 max_connections 초과하지 않도록 관리
- PgBouncer 도입 검토 (커넥션 멀티플렉싱)
- 서비스별 Read Replica 라우팅으로 읽기 부하 분산

---

## 관련 문서

| 문서 | 설명 |
|------|------|
| [DATABASE_PATTERNS.md](../architecture/DATABASE_PATTERNS.md) | HikariCP 설정 상세, Flyway 패턴 |
| [MONITORING.md](../operations/MONITORING.md) | HikariCP 메트릭 Grafana 대시보드 |
| [PHASE_1_ACTION_ITEMS.md](../deprecated/PHASE_1_ACTION_ITEMS.md) | 성능 최적화 Phase 1 결과 (deprecated) |
