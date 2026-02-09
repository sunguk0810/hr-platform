# 모니터링 가이드

> **최종 업데이트**: 2026-02-09
> **대상**: DevOps 엔지니어, 백엔드 개발자

---

## 목차

- [1. 개요](#1-개요)
- [2. 모니터링 스택](#2-모니터링-스택)
- [3. Prometheus 메트릭](#3-prometheus-메트릭)
- [4. Grafana 대시보드](#4-grafana-대시보드)
- [5. Jaeger 분산 추적](#5-jaeger-분산-추적)
- [6. 알림 규칙](#6-알림-규칙)
- [7. 로깅](#7-로깅)
- [8. 헬스체크](#8-헬스체크)
- [9. 프로덕션 모니터링 (CloudWatch)](#9-프로덕션-모니터링-cloudwatch)
- [10. 관련 문서](#10-관련-문서)

---

## 1. 개요

HR SaaS 플랫폼은 3가지 관측성(Observability) 영역을 다룹니다:

| 영역 | 도구 | 용도 |
|------|------|------|
| **메트릭** | Prometheus + Grafana | 수치 기반 성능/상태 모니터링 |
| **추적** | Jaeger (OpenTelemetry) | 분산 서비스 간 요청 추적 |
| **로깅** | Logback + CloudWatch | 이벤트/에러 로그 |

---

## 2. 모니터링 스택

### 로컬 환경 (Docker Compose)

| 도구 | URL | 용도 |
|------|-----|------|
| Prometheus | http://localhost:9009 | 메트릭 수집/쿼리 |
| Grafana | http://localhost:3000 (admin/admin) | 대시보드/시각화 |
| Jaeger | http://localhost:16686 | 분산 추적 UI |

### 데이터 소스 (자동 프로비저닝)

`docker/grafana/provisioning/datasources/datasources.yml`:

```yaml
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    isDefault: true

  - name: Jaeger
    type: jaeger
    url: http://jaeger:16686
```

---

## 3. Prometheus 메트릭

### 수집 설정

`docker/prometheus/prometheus.yml`:
- 수집 간격: 15초
- 평가 간격: 15초

### 수집 대상

| 대상 | 엔드포인트 | 메트릭 경로 |
|------|-----------|-----------|
| Prometheus 자체 | `localhost:9090` | 기본 |
| Traefik | `host.docker.internal:8090` | 기본 |
| auth-service | `host.docker.internal:8081` | `/actuator/prometheus` |
| tenant-service | `host.docker.internal:8082` | `/actuator/prometheus` |
| organization-service | `host.docker.internal:8083` | `/actuator/prometheus` |
| employee-service | `host.docker.internal:8084` | `/actuator/prometheus` |
| attendance-service | `host.docker.internal:8085` | `/actuator/prometheus` |
| approval-service | `host.docker.internal:8086` | `/actuator/prometheus` |
| mdm-service | `host.docker.internal:8087` | `/actuator/prometheus` |
| notification-service | `host.docker.internal:8088` | `/actuator/prometheus` |
| file-service | `host.docker.internal:8089` | `/actuator/prometheus` |

### 주요 메트릭 카테고리

#### JVM 메트릭

```promql
# 힙 메모리 사용률
jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"} * 100

# GC 시간 (초/분)
rate(jvm_gc_pause_seconds_sum[5m])

# 활성 스레드 수
jvm_threads_live_threads
```

#### HTTP 요청 메트릭

```promql
# 요청 속도 (초당)
rate(http_server_requests_seconds_count[5m])

# 평균 응답 시간
rate(http_server_requests_seconds_sum[5m]) / rate(http_server_requests_seconds_count[5m])

# p99 응답 시간
histogram_quantile(0.99, rate(http_server_requests_seconds_bucket[5m]))

# 에러율 (5xx)
rate(http_server_requests_seconds_count{status=~"5.."}[5m])
  / rate(http_server_requests_seconds_count[5m]) * 100
```

#### HikariCP 커넥션 풀

```promql
# 활성 커넥션 비율
(hikaricp_connections_active / hikaricp_connections_max) * 100

# 대기 커넥션 (풀 고갈 지표)
hikaricp_connections_pending

# 커넥션 타임아웃 (심각)
rate(hikaricp_connections_timeout_total[5m])

# 커넥션 획득 시간 p99
histogram_quantile(0.99, rate(hikaricp_connections_acquire_seconds_bucket[5m]))
```

#### Traefik 메트릭

```promql
# 서비스별 요청 수
traefik_service_requests_total

# 서비스별 에러율
traefik_service_requests_total{code=~"5.."}
```

---

## 4. Grafana 대시보드

### 권장 대시보드

#### 서비스 개요 대시보드

| 패널 | 메트릭 | 유형 |
|------|--------|------|
| 요청 속도 | `http_server_requests_seconds_count` | 라인 차트 |
| 응답 시간 (p50/p95/p99) | `http_server_requests_seconds` | 라인 차트 |
| 에러율 | `http_server_requests_seconds_count{status=~"5.."}` | 게이지 |
| JVM 힙 사용량 | `jvm_memory_used_bytes` | 게이지 |

#### HikariCP 대시보드

| 패널 | 메트릭 | 알림 조건 |
|------|--------|---------|
| 활성 커넥션 | `hikaricp_connections_active` | >80% of max → 경고 |
| 대기 커넥션 | `hikaricp_connections_pending` | >0 for 1분 → 경고 |
| 타임아웃 에러 | `hikaricp_connections_timeout_total` | >0 → 심각 |
| 획득 시간 | `hikaricp_connections_acquire_seconds` | p99 >1초 → 경고 |

---

## 5. Jaeger 분산 추적

### 접속

- **Jaeger UI**: http://localhost:16686

### OTLP 수집

| 프로토콜 | 포트 | 용도 |
|---------|------|------|
| gRPC | 4317 | 서비스 → Jaeger (기본) |
| HTTP | 4318 | 서비스 → Jaeger (대안) |

### 추적 활용

- 서비스 간 호출 체인 시각화
- 병목 구간 식별 (느린 DB 쿼리, 외부 API 호출)
- 에러 발생 지점 추적
- 서비스 의존성 그래프

---

## 6. 알림 규칙

### 심각 (Critical) - 즉시 대응

| 규칙 | 조건 | 액션 |
|------|------|------|
| 서비스 다운 | `up == 0` for 2분 | 온콜 호출 |
| 커넥션 타임아웃 | `rate(hikaricp_connections_timeout_total[5m]) > 0` | 풀 크기 검토 |
| 높은 에러율 | 5xx 에러율 > 5% for 5분 | 로그 확인 |
| DB 연결 실패 | `hikaricp_connections_active == 0` for 1분 | DB 상태 확인 |

### 경고 (Warning) - 조사 필요

| 규칙 | 조건 | 액션 |
|------|------|------|
| 높은 커넥션 사용 | 활성 커넥션 > 80% for 10분 | 풀 크기 증가 검토 |
| 느린 응답 | p99 > 3초 for 5분 | 쿼리 최적화 |
| 높은 힙 사용 | JVM 힙 > 85% for 10분 | 메모리 설정 검토 |
| 높은 CPU | CPU > 80% for 10분 | 스케일 아웃 검토 |

---

## 7. 로깅

### Logback 설정

각 서비스는 Spring Boot 기본 Logback을 사용합니다:

```yaml
# application.yml
logging:
  level:
    root: INFO
    com.hrsaas: DEBUG
    org.hibernate.SQL: DEBUG      # SQL 로그 (개발만)
    org.hibernate.type: TRACE     # 파라미터 바인딩 (개발만)
```

### 프로덕션 로그 (CloudWatch)

ECS Fargate의 로그는 CloudWatch Logs로 자동 전송됩니다:

| 로그 그룹 | 서비스 |
|----------|--------|
| `/ecs/hr-saas/auth-service` | auth-service |
| `/ecs/hr-saas/employee-service` | employee-service |
| ... | ... |

---

## 8. 헬스체크

### Spring Boot Actuator

각 서비스는 `/actuator/health` 엔드포인트를 노출합니다:

```bash
curl http://localhost:8084/actuator/health
# {"status":"UP","components":{"db":{"status":"UP"},"redis":{"status":"UP"}}}
```

### 헬스체크 엔드포인트

| 엔드포인트 | 용도 | 인증 |
|-----------|------|------|
| `/actuator/health` | 헬스체크 | 없음 |
| `/actuator/health/liveness` | K8s Liveness | 없음 |
| `/actuator/health/readiness` | K8s Readiness | 없음 |
| `/actuator/prometheus` | 메트릭 노출 | 없음 |
| `/actuator/info` | 빌드 정보 | 없음 |

---

## 9. 프로덕션 모니터링 (CloudWatch)

### CloudWatch 메트릭

| 네임스페이스 | 메트릭 | 용도 |
|------------|--------|------|
| `AWS/ECS` | CPUUtilization, MemoryUtilization | ECS Task 리소스 |
| `AWS/RDS` | DatabaseConnections, CPUUtilization | DB 상태 |
| `AWS/ElastiCache` | CacheHitRate, CurrConnections | 캐시 성능 |
| `AWS/ApplicationELB` | RequestCount, TargetResponseTime | ALB 트래픽 |

### CloudWatch 알림

| 알림 | 조건 | 액션 |
|------|------|------|
| ECS CPU 높음 | CPUUtilization > 80% for 5분 | Auto Scaling |
| RDS 커넥션 높음 | DatabaseConnections > 150 | 풀 크기 검토 |
| ALB 5xx 높음 | 5xx > 10/분 for 5분 | 서비스 로그 확인 |
| 캐시 히트율 낮음 | CacheHitRate < 80% | TTL/키 전략 검토 |

---

## 10. 관련 문서

| 문서 | 설명 |
|------|------|
| [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) | Prometheus, Grafana, Jaeger 로컬 설정 |
| [AWS_INFRASTRUCTURE.md](./AWS_INFRASTRUCTURE.md) | CloudWatch, RDS 모니터링 |
| [DATABASE_PATTERNS.md](../architecture/DATABASE_PATTERNS.md) | HikariCP 메트릭 상세 |
| [CACHING_STRATEGY.md](../architecture/CACHING_STRATEGY.md) | Redis 성능 모니터링 |
