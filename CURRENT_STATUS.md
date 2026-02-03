# HR Platform 현재 상태
> 저장 시간: 2026-02-03 13:35 KST

## 서비스 실행 현황

### Docker 인프라 (8개 컨테이너)
| 서비스 | 컨테이너명 | 포트 | 상태 |
|--------|-----------|------|------|
| PostgreSQL | hr-saas-postgres | 5433:5432 | healthy |
| Redis | hr-saas-redis | 6381:6379 | healthy |
| Kafka | hr-saas-kafka | 9093:9092 | healthy |
| Kafka UI | hr-saas-kafka-ui | 8090:8080 | running |
| Keycloak | hr-saas-keycloak | 8180:8080 | running |
| Jaeger | hr-saas-jaeger | 16686 | running |
| Prometheus | hr-saas-prometheus | 9090 | running |
| Grafana | hr-saas-grafana | 3000 | running |

### 마이크로서비스 (11개)
| 서비스 | 포트 | 상태 | 비고 |
|--------|------|------|------|
| Config Server | 8888 | DOWN | config 저장소 미설정 (개발 시 불필요) |
| Gateway | 8080 | UP | reactive 모드로 실행 |
| Auth | 8081 | UP | |
| Tenant | 8082 | UP | |
| Organization | 8083 | UP | |
| Employee | 8084 | UP | |
| Attendance | 8085 | UP | |
| Approval | 8086 | UP | |
| MDM | 8087 | UP | |
| Notification | 8088 | DOWN | 메일 서버 미설정 (서비스는 실행 중) |
| File | 8089 | UP | |

## 서비스 재시작 명령어

### Docker 인프라 시작
```bash
cd D:\project\2026\hr-platform\docker
docker-compose up -d
```

### 마이크로서비스 시작 (순서대로)
```bash
cd D:\project\2026\hr-platform

# Config Server (선택적)
java -jar infra/config-server/build/libs/config-server.jar --server.port=8888 > logs/config-server.log 2>&1 &

# Gateway (반드시 reactive 모드)
java -jar services/gateway-service/build/libs/gateway-service.jar \
  --server.port=8080 \
  --spring.main.web-application-type=reactive \
  --spring.data.redis.host=localhost \
  --spring.data.redis.port=6381 \
  --spring.data.redis.password=redis_password \
  --spring.cloud.config.enabled=false \
  > logs/gateway-service.log 2>&1 &

# 나머지 서비스들 (공통 옵션)
# --spring.datasource.url=jdbc:postgresql://localhost:5433/hr_saas
# --spring.datasource.username=hr_saas
# --spring.datasource.password=hr_saas_password
# --spring.data.redis.host=localhost
# --spring.data.redis.port=6381
# --spring.data.redis.password=redis_password
# --spring.cloud.config.enabled=false
# --spring.jpa.hibernate.ddl-auto=update
# --spring.flyway.enabled=false

# Auth Service
java -jar services/auth-service/build/libs/auth-service.jar --server.port=8081 \
  --spring.datasource.url=jdbc:postgresql://localhost:5433/hr_saas \
  --spring.datasource.username=hr_saas --spring.datasource.password=hr_saas_password \
  --spring.data.redis.host=localhost --spring.data.redis.port=6381 --spring.data.redis.password=redis_password \
  --spring.cloud.config.enabled=false --spring.jpa.hibernate.ddl-auto=update --spring.flyway.enabled=false \
  > logs/auth-service.log 2>&1 &

# Tenant Service
java -jar services/tenant-service/build/libs/tenant-service.jar --server.port=8082 \
  --spring.datasource.url=jdbc:postgresql://localhost:5433/hr_saas \
  --spring.datasource.username=hr_saas --spring.datasource.password=hr_saas_password \
  --spring.data.redis.host=localhost --spring.data.redis.port=6381 --spring.data.redis.password=redis_password \
  --spring.cloud.config.enabled=false --spring.jpa.hibernate.ddl-auto=update --spring.flyway.enabled=false \
  > logs/tenant-service.log 2>&1 &

# Organization Service
java -jar services/organization-service/build/libs/organization-service.jar --server.port=8083 \
  --spring.datasource.url=jdbc:postgresql://localhost:5433/hr_saas \
  --spring.datasource.username=hr_saas --spring.datasource.password=hr_saas_password \
  --spring.data.redis.host=localhost --spring.data.redis.port=6381 --spring.data.redis.password=redis_password \
  --spring.cloud.config.enabled=false --spring.jpa.hibernate.ddl-auto=update --spring.flyway.enabled=false \
  > logs/organization-service.log 2>&1 &

# Employee Service
java -jar services/employee-service/build/libs/employee-service.jar --server.port=8084 \
  --spring.datasource.url=jdbc:postgresql://localhost:5433/hr_saas \
  --spring.datasource.username=hr_saas --spring.datasource.password=hr_saas_password \
  --spring.data.redis.host=localhost --spring.data.redis.port=6381 --spring.data.redis.password=redis_password \
  --spring.cloud.config.enabled=false --spring.jpa.hibernate.ddl-auto=update --spring.flyway.enabled=false \
  > logs/employee-service.log 2>&1 &

# Attendance Service
java -jar services/attendance-service/build/libs/attendance-service.jar --server.port=8085 \
  --spring.datasource.url=jdbc:postgresql://localhost:5433/hr_saas \
  --spring.datasource.username=hr_saas --spring.datasource.password=hr_saas_password \
  --spring.data.redis.host=localhost --spring.data.redis.port=6381 --spring.data.redis.password=redis_password \
  --spring.cloud.config.enabled=false --spring.jpa.hibernate.ddl-auto=update --spring.flyway.enabled=false \
  > logs/attendance-service.log 2>&1 &

# Approval Service
java -jar services/approval-service/build/libs/approval-service.jar --server.port=8086 \
  --spring.datasource.url=jdbc:postgresql://localhost:5433/hr_saas \
  --spring.datasource.username=hr_saas --spring.datasource.password=hr_saas_password \
  --spring.data.redis.host=localhost --spring.data.redis.port=6381 --spring.data.redis.password=redis_password \
  --spring.cloud.config.enabled=false --spring.jpa.hibernate.ddl-auto=update --spring.flyway.enabled=false \
  > logs/approval-service.log 2>&1 &

# MDM Service
java -jar services/mdm-service/build/libs/mdm-service.jar --server.port=8087 \
  --spring.datasource.url=jdbc:postgresql://localhost:5433/hr_saas \
  --spring.datasource.username=hr_saas --spring.datasource.password=hr_saas_password \
  --spring.data.redis.host=localhost --spring.data.redis.port=6381 --spring.data.redis.password=redis_password \
  --spring.cloud.config.enabled=false --spring.jpa.hibernate.ddl-auto=update --spring.flyway.enabled=false \
  > logs/mdm-service.log 2>&1 &

# Notification Service
java -jar services/notification-service/build/libs/notification-service.jar --server.port=8088 \
  --spring.datasource.url=jdbc:postgresql://localhost:5433/hr_saas \
  --spring.datasource.username=hr_saas --spring.datasource.password=hr_saas_password \
  --spring.data.redis.host=localhost --spring.data.redis.port=6381 --spring.data.redis.password=redis_password \
  --spring.cloud.config.enabled=false --spring.jpa.hibernate.ddl-auto=update --spring.flyway.enabled=false \
  > logs/notification-service.log 2>&1 &

# File Service
java -jar services/file-service/build/libs/file-service.jar --server.port=8089 \
  --spring.datasource.url=jdbc:postgresql://localhost:5433/hr_saas \
  --spring.datasource.username=hr_saas --spring.datasource.password=hr_saas_password \
  --spring.data.redis.host=localhost --spring.data.redis.port=6381 --spring.data.redis.password=redis_password \
  --spring.cloud.config.enabled=false --spring.jpa.hibernate.ddl-auto=update --spring.flyway.enabled=false \
  > logs/file-service.log 2>&1 &
```

### 서비스 상태 확인
```bash
# 전체 상태 확인
for port in 8080 8081 8082 8083 8084 8085 8086 8087 8088 8089; do
  echo "Port $port: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:$port/actuator/health)"
done

# Docker 상태 확인
docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
```

## 주요 접속 URL

| 서비스 | URL |
|--------|-----|
| Gateway API | http://localhost:8080 |
| Keycloak Admin | http://localhost:8180 |
| Kafka UI | http://localhost:8090 |
| Jaeger UI | http://localhost:16686 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 |

## DB 접속 정보

| 항목 | 값 |
|------|-----|
| Host | localhost |
| Port | 5433 |
| Database | hr_saas |
| Username | hr_saas |
| Password | hr_saas_password |

## Redis 접속 정보

| 항목 | 값 |
|------|-----|
| Host | localhost |
| Port | 6381 |
| Password | redis_password |

## 생성된 DB 스키마

- hr_auth
- hr_tenant
- hr_organization
- hr_employee
- hr_attendance
- hr_approval
- hr_mdm
- hr_notification
- hr_file
- hr_core

## 해결된 주요 이슈

1. **Spring Boot 3.x Redis 설정**: `spring.redis.*` → `spring.data.redis.*`
2. **Gateway WebFlux 충돌**: `--spring.main.web-application-type=reactive` 필요
3. **포트 충돌**: PostgreSQL 5433, Redis 6381, Kafka 9093 사용
4. **DataSource Bean 충돌**: DatabaseConfig에 @Primary 추가
5. **@SuperBuilder 상속**: BaseEntity, AuditableEntity에 @SuperBuilder, @NoArgsConstructor 추가

## 다음 작업 (계획)

- [ ] API 테스트 (Postman/curl)
- [ ] Keycloak Realm 설정
- [ ] 서비스 간 통신 테스트
- [ ] E2E 테스트 (휴가신청 → 결재 → 알림)
