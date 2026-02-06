# Module 08: Notification Service (알림 관리)

> 분석일: 2026-02-06
> 포트: 8088
> 패키지: `com.hrsaas.notification`
> DB 스키마: `hr_notification`

---

## 1. 현재 구현 상태 요약

### 1.1 완료된 기능

| 기능 | 상태 | 설명 |
|------|------|------|
| 알림 발송 | ✅ 완료 | SendNotificationRequest 기반 멀티채널 발송, 채널별 Notification 생성 |
| 알림 조회 | ✅ 완료 | 내 알림 목록 (페이징), 상세 조회, 수신자 소유권 검증 |
| 읽지 않은 알림 | ✅ 완료 | 미읽음 목록 조회, 미읽음 건수 카운트 |
| 읽음 처리 | ✅ 완료 | 단건 읽음, 전체 읽음 처리 (JPQL UPDATE) |
| 알림 삭제 | ✅ 완료 | 단건 삭제, 일괄 삭제 (소유권 검증) |
| SSE 실시간 알림 | ✅ 완료 | SseEmitterRegistry + SseSender, 30분 타임아웃, 30초 하트비트 |
| WebSocket 알림 | ✅ 완료 | STOMP 기반 WebPushSender, SockJS 폴백, /user/{userId}/queue/notifications |
| 이메일 발송 | ✅ 완료 | JavaMailSender + Thymeleaf 템플릿, 폴백 HTML 지원 |
| 알림 템플릿 | ✅ 완료 | NotificationTemplate CRUD, 코드+채널 유일성, 소프트 삭제 |
| 템플릿 렌더링 | ✅ 완료 | TemplateRenderer — `{{variable}}` 치환, 중첩 속성(dot notation) 지원 |
| 비동기 디스패치 | ✅ 완료 | NotificationDispatcher @Async, 우선순위 기반 발송자 선택 |
| 발송 상태 추적 | ✅ 완료 | isSent/sentAt/sendError 필드로 발송 성공/실패 추적 |
| SQS 이벤트 수신 | ✅ 완료 | DomainEventListener — ApprovalSubmittedEvent 처리 |
| RLS | ✅ 완료 | 3개 테이블 모두 RLS 적용 (notification, template, preference) |
| ddl-auto: validate | ✅ 올바름 | Flyway 마이그레이션 + validate 모드 |

### 1.2 미구현 / 갭

| 갭 ID | 기능 | 우선순위 | 설명 |
|--------|------|----------|------|
| NTF-G01 | 알림 설정 영속화 | HIGH | getSettings/updateSettings가 TODO — NotificationPreference 테이블 존재하나 연동 안됨 |
| NTF-G02 | SMS 발송 구현 | HIGH | SmsSender가 스텁 (항상 true 반환) → **정책결정: AWS SNS 사용** (§2.1) |
| NTF-G03 | 카카오 알림톡 | MEDIUM | NotificationChannel.KAKAO 정의되어 있으나 KakaoSender 없음 → **정책결정: Phase 2** (§2.2) |
| NTF-G04 | 알림 보존/자동 삭제 | HIGH | 알림 데이터 자동 삭제/아카이빙 없음 → **정책결정: 90일 보존** (§2.3) |
| NTF-G05 | 야간 무음 (Quiet Hours) | MEDIUM | quietHoursEnabled 필드만 존재, 로직 없음 → **정책결정: 구현** (§2.4) |
| NTF-G06 | 다이제스트 (요약 알림) | MEDIUM | digestEnabled 필드만 존재, 로직 없음 → **정책결정: 구현** (§2.5) |
| NTF-G07 | LeaveRequestCreated 처리 | HIGH | DomainEventListener에 TODO — 휴가 신청 시 매니저 알림 미구현 |
| NTF-G08 | EmployeeCreated 처리 | MEDIUM | DomainEventListener에 TODO — 신규 입사자 환영 알림 미구현 |
| NTF-G09 | ApprovalCompleted 수신 | HIGH | 결재 완료(승인/반려) 이벤트 수신 → 기안자 알림 미구현 |
| NTF-G10 | 알림 재발송 | LOW | 실패한 알림 재시도 메커니즘 없음 (findUnsentNotifications 쿼리는 존재) |
| NTF-G11 | Firebase 푸시 | LOW | build.gradle에 Firebase Admin SDK 있으나 FirebaseSender 미구현 |
| NTF-G12 | 알림 설정 기반 필터링 | HIGH | NotificationPreference에 따른 채널별 발송 필터링 로직 없음 |
| NTF-G13 | 이메일 HTML 템플릿 | LOW | templates/email/notification.html 템플릿 파일 부재 (폴백 HTML로 동작) |

---

## 2. 정책 결정사항

### 2.1 SMS 발송 제공자 ✅ 결정완료

> **결정: AWS SNS SMS 사용**

- 이미 SQS/SNS 인프라를 사용 중이므로 SNS SMS 기능 활용
- `SmsSender` 구현 시 `SnsClient.publish()` 호출
- SMS 발송 비용: 건당 ~$0.04 (한국 번호)
- 수신자 전화번호: employee-service에서 조회 (EmployeeClient Feign)
- 발신번호 등록 필요 (한국 통신법 준수)

### 2.2 카카오 알림톡 ✅ 결정완료

> **결정: Phase 2에서 구현**

- 현재는 WEB_PUSH, EMAIL만 활성 채널
- SMS는 AWS SNS로 구현 (§2.1)
- KAKAO 채널은 enum에 유지하되 KakaoSender는 Phase 2에서 구현
- Phase 2 시 카카오 비즈메시지 API 연동

### 2.3 알림 보존 정책 ✅ 결정완료

> **결정: 90일 보존 후 자동 삭제**

- 스케줄러로 90일 경과 알림 자동 삭제
- 실행 주기: 매일 새벽 03:00 (테넌트별 순차 처리)
- 삭제 대상: `created_at < NOW() - INTERVAL '90 days'`
- 배치 삭제: 1,000건씩 분할 삭제 (DB 부하 방지)
- 삭제 전 건수 로그 기록

### 2.4 야간 무음 (Quiet Hours) ✅ 결정완료

> **결정: 구현**

- 사용자별 야간 무음 시간대 설정 가능
- 기본값: 22:00 ~ 07:00 (테넌트별 기본 설정 가능)
- 적용 대상: EMAIL, SMS 채널 (WEB_PUSH는 항상 발송)
- 무음 시간대 발송 보류 → 무음 해제 시 일괄 발송
- `notification_preferences` 테이블에 quiet_start_time, quiet_end_time 컬럼 추가 필요
- 보류된 알림은 `is_sent = false` 상태로 유지, 스케줄러가 무음 해제 시 재발송

### 2.5 다이제스트 (요약 알림) ✅ 결정완료

> **결정: 구현**

- 사용자별 다이제스트 활성화 시 개별 이메일 대신 일간 요약 이메일 발송
- 다이제스트 스케줄: 매일 09:00 (출근 시간)
- 요약 내용: 전일 발생한 알림 유형별 건수 + 상위 5건 상세
- 적용 대상: EMAIL 채널만
- WEB_PUSH 알림은 다이제스트 대상에서 제외 (실시간 유지)
- 다이제스트 활성화 사용자의 EMAIL 채널 알림은 `is_sent` 없이 저장만 → 스케줄러가 일괄 발송

---

## 3. 아키텍처

### 3.1 서비스 구조

```
com.hrsaas.notification/
├── config/
│   ├── SecurityConfig.java           # 보안 설정 (JWT 필터)
│   ├── WebSocketConfig.java          # STOMP WebSocket 설정
│   └── MailConfig.java               # Thymeleaf 이메일 템플릿 엔진
├── controller/
│   ├── NotificationController.java   # 알림 CRUD REST API (11 엔드포인트)
│   ├── SseController.java            # SSE 구독/해제 (2 엔드포인트)
│   └── NotificationTemplateController.java  # 템플릿 관리 (5 엔드포인트)
├── service/
│   ├── NotificationService.java      # 인터페이스 (11 메서드)
│   ├── impl/NotificationServiceImpl.java    # 구현체
│   └── NotificationTemplateService.java     # 템플릿 서비스 (렌더링 포함)
├── sender/
│   ├── NotificationSender.java       # 발송자 인터페이스 (send, supports, getPriority)
│   ├── NotificationDispatcher.java   # 비동기 디스패처 (@Async)
│   ├── SseSender.java               # SSE 발송 (priority: 0)
│   ├── WebPushSender.java           # WebSocket/STOMP 발송 (priority: 1)
│   ├── EmailSender.java             # 이메일 발송 (priority: 10)
│   └── SmsSender.java               # SMS 발송 스텁 (priority: 20)
├── listener/
│   └── DomainEventListener.java      # SQS 이벤트 리스너
├── infrastructure/
│   ├── SseEmitterRegistry.java       # SSE 커넥션 레지스트리 (ConcurrentHashMap)
│   └── TemplateRenderer.java         # {{variable}} 템플릿 렌더러
├── repository/
│   ├── NotificationRepository.java            # 알림 (5 쿼리)
│   ├── NotificationTemplateRepository.java    # 템플릿 (4 쿼리)
│   └── NotificationPreferenceRepository.java  # 설정 (2 쿼리)
└── domain/
    ├── entity/   # 3 엔티티 + 2 enum
    └── dto/      # 2 request + 2 response
```

### 3.2 발송 우선순위 체인 (Strategy Pattern)

```
NotificationDispatcher (비동기)
  │
  ├─ Priority 0: SseSender          → SSE 연결된 사용자에게 즉시 전송
  │                                    (SseEmitterRegistry에서 emitter 조회)
  │
  ├─ Priority 1: WebPushSender      → STOMP WebSocket으로 전송
  │                                    (/user/{userId}/queue/notifications)
  │
  ├─ Priority 10: EmailSender       → JavaMailSender + Thymeleaf 템플릿
  │                                    (smtp.gmail.com:587, STARTTLS)
  │
  └─ Priority 20: SmsSender         → TODO: AWS SNS SMS 구현 예정
```

### 3.3 이벤트 흐름

```
┌──────────────────────────────┐
│ 다른 서비스 (이벤트 발행)       │
│                              │
│  approval-service            │
│    → ApprovalSubmittedEvent  │
│    → ApprovalCompletedEvent  │  ← NTF-G09 (미수신)
│                              │
│  attendance-service          │
│    → LeaveRequestCreatedEvent│  ← NTF-G07 (TODO)
│                              │
│  employee-service            │
│    → EmployeeCreatedEvent    │  ← NTF-G08 (TODO)
└──────────┬───────────────────┘
           │ SQS: notification-service-queue
           ▼
┌──────────────────────────────┐
│ DomainEventListener          │
│  @SqsListener                │
│  - SNS envelope 파싱         │
│  - eventType별 분기 처리      │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ NotificationService.send()   │
│  - 채널별 Notification 생성   │
│  - DB 저장                    │
│  - NotificationDispatcher    │
│    .dispatchAll() @Async     │
└──────────────────────────────┘
```

### 3.4 실시간 알림 연결 흐름

```
클라이언트
  │
  ├─ SSE: GET /api/v1/notifications/sse/subscribe
  │       → SseEmitter (30분 타임아웃)
  │       → SseEmitterRegistry.register(userId, emitter)
  │       → 30초마다 heartbeat "ping"
  │
  └─ WebSocket: ws://host/ws/notifications (SockJS)
               → STOMP /user/{userId}/queue/notifications
```

---

## 4. API 엔드포인트

### 4.1 알림 (`/api/v1/notifications`)

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| POST | `/` | 알림 발송 | HR_ADMIN, TENANT_ADMIN, SUPER_ADMIN |
| GET | `/my` | 내 알림 목록 (페이징) | 인증 필요 |
| GET | `/my/unread` | 읽지 않은 알림 목록 | 인증 필요 |
| GET | `/my/unread/count` | 읽지 않은 알림 수 | 인증 필요 |
| GET | `/{id}` | 알림 상세 조회 | 인증 필요 |
| POST | `/{id}/read` | 알림 읽음 처리 | 인증 필요 |
| POST | `/my/read-all` | 모든 알림 읽음 처리 | 인증 필요 |
| DELETE | `/{id}` | 알림 삭제 | 인증 필요 |
| POST | `/bulk-delete` | 알림 일괄 삭제 | 인증 필요 |
| GET | `/settings` | 알림 설정 조회 | 인증 필요 |
| PUT | `/settings` | 알림 설정 수정 | 인증 필요 |

### 4.2 SSE 실시간 (`/api/v1/notifications/sse`)

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/subscribe` | SSE 구독 (text/event-stream) | 인증 필요 |
| DELETE | `/unsubscribe` | SSE 구독 해제 | 인증 필요 |

### 4.3 알림 템플릿 (`/api/v1/notifications/templates`)

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/` | 템플릿 목록 (페이징) | HR_ADMIN 이상 |
| GET | `/{templateId}` | 템플릿 상세 | HR_ADMIN 이상 |
| POST | `/` | 템플릿 생성 | HR_ADMIN 이상 |
| PUT | `/{templateId}` | 템플릿 수정 | HR_ADMIN 이상 |
| DELETE | `/{templateId}` | 템플릿 비활성화 | TENANT_ADMIN 이상 |

---

## 5. 엔티티 모델

### 5.1 notification (알림)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | UUID | PK | |
| tenant_id | UUID | NOT NULL | RLS 대상 |
| recipient_id | UUID | NOT NULL | 수신자 ID |
| recipient_email | VARCHAR | | 수신자 이메일 (EMAIL 채널 시 필요) |
| notification_type | VARCHAR | NOT NULL | APPROVAL_REQUESTED / APPROVAL_APPROVED 등 |
| channel | VARCHAR | NOT NULL | WEB_PUSH / EMAIL / SMS / KAKAO |
| title | VARCHAR | NOT NULL | 알림 제목 |
| content | TEXT | NOT NULL | 알림 내용 |
| link_url | VARCHAR | | 연결 URL |
| reference_type | VARCHAR | | 참조 엔티티 유형 |
| reference_id | UUID | | 참조 엔티티 ID |
| is_read | BOOLEAN | NOT NULL, DEFAULT false | 읽음 여부 |
| read_at | TIMESTAMP | | 읽은 시각 |
| is_sent | BOOLEAN | NOT NULL, DEFAULT false | 발송 성공 여부 |
| sent_at | TIMESTAMP | | 발송 시각 |
| send_error | VARCHAR | | 발송 실패 사유 |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |
| created_by | VARCHAR | | |
| updated_by | VARCHAR | | |

**인덱스:** tenant_id, recipient_id, notification_type, channel, is_read, (is_read=false, is_sent=true) 미읽음+발송완료, (reference_type, reference_id), created_at

### 5.2 notification_template (알림 템플릿)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | UUID | PK | |
| tenant_id | UUID | NOT NULL | RLS 대상 |
| code | VARCHAR | NOT NULL, UNIQUE(tenant_id, code) | 템플릿 코드 |
| notification_type | VARCHAR | NOT NULL | 알림 유형 |
| channel | VARCHAR | NOT NULL | 채널 |
| name | VARCHAR | NOT NULL | 템플릿 이름 |
| subject | VARCHAR | | 이메일 제목 (EMAIL 채널) |
| body_template | TEXT | NOT NULL | 본문 템플릿 (`{{variable}}` 형식) |
| description | VARCHAR | | 설명 |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | 활성 여부 |
| variables | TEXT | | 변수 목록 (JSON) |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |
| created_by | VARCHAR | | |
| updated_by | VARCHAR | | |

**인덱스:** tenant_id, notification_type, channel

### 5.3 notification_preference (알림 설정)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | UUID | PK | |
| tenant_id | UUID | NOT NULL | RLS 대상 |
| user_id | UUID | NOT NULL | 사용자 ID |
| notification_type | VARCHAR | NOT NULL | 알림 유형 |
| channel | VARCHAR | NOT NULL | 채널 |
| enabled | BOOLEAN | NOT NULL, DEFAULT true | 수신 여부 |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |
| created_by | VARCHAR | | |
| updated_by | VARCHAR | | |

**UNIQUE 제약조건:** (tenant_id, user_id, notification_type, channel)
**인덱스:** tenant_id, user_id

---

## 6. Enum 정의

### 6.1 NotificationType (알림 유형)

| 값 | 설명 | 이벤트 소스 |
|----|------|-----------|
| APPROVAL_REQUESTED | 결재 요청됨 | ApprovalSubmittedEvent |
| APPROVAL_APPROVED | 결재 승인됨 | ApprovalCompletedEvent (NTF-G09) |
| APPROVAL_REJECTED | 결재 반려됨 | ApprovalCompletedEvent (NTF-G09) |
| LEAVE_REQUESTED | 휴가 신청됨 | LeaveRequestCreatedEvent (NTF-G07) |
| LEAVE_APPROVED | 휴가 승인됨 | (attendance-service에서 직접 처리) |
| LEAVE_REJECTED | 휴가 반려됨 | (attendance-service에서 직접 처리) |
| EMPLOYEE_JOINED | 신규 입사 | EmployeeCreatedEvent (NTF-G08) |
| EMPLOYEE_RESIGNED | 퇴사 | (미연동) |
| ANNOUNCEMENT | 공지사항 | 직접 API 호출 |
| SYSTEM | 시스템 알림 | 직접 API 호출 |

### 6.2 NotificationChannel (발송 채널)

| 값 | 발송자 | 우선순위 | 구현 상태 |
|----|--------|---------|----------|
| WEB_PUSH | SseSender + WebPushSender | 0, 1 | ✅ 완료 |
| EMAIL | EmailSender | 10 | ✅ 완료 |
| SMS | SmsSender | 20 | ⏳ AWS SNS 구현 예정 |
| KAKAO | (없음) | - | ⏳ Phase 2 |

---

## 7. 발송자 (NotificationSender) 상세

### 7.1 SseSender (priority: 0)

- SSE 연결이 있는 사용자에게 즉시 전송
- `SseEmitterRegistry.get(recipientId)` → SseEmitter
- 전송 데이터: id, type, title, content, linkUrl, referenceType, referenceId, createdAt
- 이벤트명: `notification`
- IOException 발생 시 emitter 제거

### 7.2 WebPushSender (priority: 1)

- STOMP WebSocket으로 전송
- 목적지: `/user/{userId}/queue/notifications`
- `SimpMessagingTemplate.convertAndSend()` 사용
- WEB_PUSH 채널의 폴백 역할

### 7.3 EmailSender (priority: 10)

- `JavaMailSender` + Thymeleaf `TemplateEngine`
- SMTP: smtp.gmail.com:587 (STARTTLS)
- 발신: `notification.email.from` (기본: noreply@hrsaas.com)
- 수신자 이메일 필수 (`recipientEmail`)
- 템플릿: `templates/email/notification.html` → 없으면 폴백 HTML
- 폴백 HTML: 제목, 내용, 링크 버튼, 푸터 포함
- `notification.email.enabled` 설정으로 ON/OFF

### 7.4 SmsSender (priority: 20) — TODO

- 현재 스텁 (항상 true 반환)
- `notification.sms.enabled` = false (기본)
- `notification.sms.provider` = "none" (기본)
- **구현 예정: AWS SNS SMS** (§2.1)

---

## 8. 인프라 구성요소

### 8.1 SseEmitterRegistry

- `ConcurrentHashMap<UUID, SseEmitter>` — 스레드 안전
- 사용자당 1개 emitter (신규 등록 시 기존 교체)
- 자동 정리: onCompletion, onTimeout, onError 시 제거
- `getActiveCount()`: 활성 연결 수 모니터링

### 8.2 TemplateRenderer

- 정규식: `\{\{\s*([^}]+)\s*\}\}` — `{{variable}}` 패턴
- 중첩 속성 지원: `{{employee.name}}` → Map 또는 getter 리플렉션
- null/빈 변수는 빈 문자열로 치환

### 8.3 WebSocket 설정

```java
// WebSocketConfig.java
configureMessageBroker:
  simpleBroker: /queue, /topic
  applicationDestinationPrefixes: /app
  userDestinationPrefix: /user

registerStompEndpoints:
  endpoint: /ws/notifications
  allowedOrigins: *
  withSockJS: true
```

---

## 9. 설정값

### 9.1 application.yml

```yaml
server:
  port: 8088

spring:
  application:
    name: notification-service
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5433}/hr_saas
    username: ${DB_USERNAME:hr_saas}
    password: ${DB_PASSWORD:hr_saas_password}
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        default_schema: hr_notification
  flyway:
    enabled: true
    locations: classpath:db/migration
    schemas: hr_notification
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6381}
      password: ${REDIS_PASSWORD:redis_password}
  mail:
    host: ${MAIL_HOST:smtp.gmail.com}
    port: ${MAIL_PORT:587}
    username: ${MAIL_USERNAME:}
    password: ${MAIL_PASSWORD:}
    properties:
      mail.smtp:
        auth: true
        starttls.enable: true
  cloud:
    aws:
      region:
        static: ${AWS_REGION:ap-northeast-2}
      sns:
        endpoint: ${AWS_SNS_ENDPOINT:http://localhost:4566}
      sqs:
        endpoint: ${AWS_SQS_ENDPOINT:http://localhost:4566}

notification:
  email:
    from: ${NOTIFICATION_EMAIL_FROM:noreply@hrsaas.com}
    from-name: ${NOTIFICATION_EMAIL_FROM_NAME:HR SaaS}
    enabled: ${NOTIFICATION_EMAIL_ENABLED:true}
  sms:
    enabled: ${NOTIFICATION_SMS_ENABLED:false}
    provider: ${NOTIFICATION_SMS_PROVIDER:none}

jwt:
  secret: ${JWT_SECRET:...}
  access-token-expiry: 1800
  refresh-token-expiry: 604800
```

### 9.2 build.gradle 의존성

```groovy
dependencies {
    // Common modules
    implementation project(':common:common-core')
    implementation project(':common:common-entity')
    implementation project(':common:common-response')
    implementation project(':common:common-database')
    implementation project(':common:common-tenant')
    implementation project(':common:common-security')
    implementation project(':common:common-cache')
    implementation project(':common:common-event')

    // Spring Boot
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-mail'
    implementation 'org.springframework.boot:spring-boot-starter-websocket'
    implementation 'org.springframework.boot:spring-boot-starter-thymeleaf'
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'

    // Spring Cloud (Feign, CircuitBreaker)
    implementation 'org.springframework.cloud:spring-cloud-starter-openfeign'
    implementation 'org.springframework.cloud:spring-cloud-starter-circuitbreaker-resilience4j'

    // Firebase (Push Notifications)
    implementation 'com.google.firebase:firebase-admin:9.2.0'

    // Database
    runtimeOnly 'org.postgresql:postgresql'
    implementation 'org.flywaydb:flyway-core'

    // API Documentation
    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui'
}
```

---

## 10. 에러코드

| 코드 | HTTP | 메시지 | 발생 위치 |
|------|------|--------|----------|
| NTF_001 | 404 | 알림을 찾을 수 없습니다 | NotificationServiceImpl — findById 실패 |
| NTF_002 | 403 | 본인의 알림만 처리할 수 있습니다 | NotificationServiceImpl — 수신자 소유권 검증 실패 |
| NTF_T01 | 404 | 템플릿을 찾을 수 없습니다 (ID) | NotificationTemplateService — findById 실패 |
| NTF_T02 | 404 | 템플릿을 찾을 수 없습니다 (코드) | NotificationTemplateService — findByCode 실패 |
| IllegalArgument | 400 | 동일한 코드와 채널의 템플릿이 이미 존재합니다 | NotificationTemplateService.create — 코드 중복 |

---

## 11. 갭 구현 사양

### NTF-G01: 알림 설정 영속화 (HIGH)

**현재 상태:** `NotificationPreference` 엔티티와 테이블이 존재하나, getSettings/updateSettings에서 사용하지 않음 (하드코딩 기본값 반환)

**구현 방향:**
```java
// NotificationServiceImpl.getSettings() 수정
@Override
public NotificationSettingsResponse getSettings(UUID userId) {
    UUID tenantId = TenantContext.getCurrentTenant();
    List<NotificationPreference> prefs =
        preferenceRepository.findByTenantIdAndUserId(tenantId, userId);

    // prefs를 채널×유형 매트릭스로 변환
    // 기본값: 모든 채널/유형 enabled=true (preference 레코드 없으면 기본 활성)
    return buildSettingsResponse(prefs);
}

// NotificationServiceImpl.updateSettings() 수정
@Override
@Transactional
public NotificationSettingsResponse updateSettings(UUID userId, UpdateNotificationSettingsRequest request) {
    // request의 각 필드에 대해 NotificationPreference upsert
    // 예: approvalNotifications=false → APPROVAL_REQUESTED/APPROVED/REJECTED 유형 전체 비활성화
}
```

### NTF-G02: SMS 발송 — AWS SNS (HIGH)

**구현 방향:**
```java
@Component
@RequiredArgsConstructor
public class SmsSender implements NotificationSender {

    private final SnsClient snsClient;

    @Value("${notification.sms.enabled:false}")
    private boolean smsEnabled;

    @Override
    public boolean send(Notification notification) {
        if (!smsEnabled) return true;

        String phoneNumber = notification.getRecipientPhone(); // 새 필드 필요
        if (phoneNumber == null) return false;

        PublishRequest req = PublishRequest.builder()
            .phoneNumber(phoneNumber)
            .message(notification.getContent())
            .build();

        snsClient.publish(req);
        return true;
    }
}
```

- `Notification` 엔티티에 `recipientPhone` 필드 추가
- `SendNotificationRequest`에 `recipientPhone` 필드 추가
- SQL 마이그레이션: `ALTER TABLE notifications ADD COLUMN recipient_phone VARCHAR;`

### NTF-G04: 알림 보존 90일 자동 삭제 (HIGH)

**구현 방향:**
```java
@Component
@RequiredArgsConstructor
public class NotificationCleanupScheduler {

    private final NotificationRepository notificationRepository;

    @Scheduled(cron = "0 0 3 * * *")  // 매일 03:00
    @Transactional
    public void cleanupOldNotifications() {
        Instant cutoff = Instant.now().minus(90, ChronoUnit.DAYS);
        int totalDeleted = 0;
        int batch;
        do {
            batch = notificationRepository.deleteOlderThan(cutoff, 1000);
            totalDeleted += batch;
        } while (batch == 1000);
        log.info("Cleaned up {} old notifications", totalDeleted);
    }
}
```

- Repository에 추가: `@Modifying @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoff") int deleteOlderThan(@Param("cutoff") Instant cutoff, Pageable pageable);`

### NTF-G05: 야간 무음 (Quiet Hours) (MEDIUM)

**구현 방향:**
1. **DB 변경:**
   ```sql
   ALTER TABLE notification_preferences ADD COLUMN quiet_start_time TIME;
   ALTER TABLE notification_preferences ADD COLUMN quiet_end_time TIME;
   -- 기본값: 22:00 ~ 07:00
   ```
2. **디스패처 수정:**
   ```java
   // NotificationDispatcher.dispatch() 에서 야간 무음 체크
   if (isQuietHours(notification.getRecipientId(), notification.getChannel())) {
       // EMAIL/SMS 채널이면 발송 보류 (is_sent = false 유지)
       // WEB_PUSH는 항상 발송
       return;
   }
   ```
3. **스케줄러:** 매 시간 정각에 보류된 알림 재발송 시도

### NTF-G06: 다이제스트 (요약 알림) (MEDIUM)

**구현 방향:**
1. **스케줄러:**
   ```java
   @Scheduled(cron = "0 0 9 * * *")  // 매일 09:00
   public void sendDailyDigest() {
       // 1. digestEnabled=true 사용자 목록 조회
       // 2. 전일 00:00~23:59 발생한 미발송 EMAIL 알림 집계
       // 3. 유형별 건수 + 상위 5건 상세 정보
       // 4. 다이제스트 이메일 템플릿 렌더링
       // 5. EmailSender로 발송
       // 6. 원본 알림들 is_sent = true 처리
   }
   ```
2. **다이제스트 전용 이메일 템플릿:** `templates/email/digest.html`

### NTF-G07: LeaveRequestCreated 처리 (HIGH)

**구현 방향:**
```java
private void handleLeaveRequested(JsonNode event) {
    UUID managerId = getUUID(event, "managerId");
    if (managerId == null) return;

    String employeeName = event.get("employeeName").asText();
    String leaveType = event.get("leaveType").asText();

    SendNotificationRequest request = SendNotificationRequest.builder()
        .recipientId(managerId)
        .notificationType(NotificationType.LEAVE_REQUESTED)
        .title(employeeName + "님이 " + leaveType + " 휴가를 신청했습니다")
        .content("...")
        .linkUrl("/attendance/leave-approval")
        .channels(List.of(NotificationChannel.WEB_PUSH, NotificationChannel.EMAIL))
        .build();

    notificationService.send(request);
}
```

### NTF-G09: ApprovalCompleted 수신 (HIGH)

**구현 방향:**
- DomainEventListener에 `ApprovalCompletedEvent` 케이스 추가
- 기안자(drafterId)에게 승인/반려 결과 알림 발송
- 알림 유형: `APPROVAL_APPROVED` 또는 `APPROVAL_REJECTED` (status에 따라)

### NTF-G12: 알림 설정 기반 필터링 (HIGH)

**구현 방향:**
```java
// NotificationServiceImpl.send() 에서 설정 확인
for (NotificationChannel channel : channels) {
    // 사용자의 해당 type+channel preference 조회
    boolean enabled = preferenceRepository
        .findByTenantIdAndUserIdAndTypeAndChannel(tenantId, recipientId, type, channel)
        .map(NotificationPreference::getEnabled)
        .orElse(true);  // 설정 없으면 기본 활성

    if (!enabled) {
        log.debug("Notification filtered by user preference: user={}, type={}, channel={}",
            recipientId, type, channel);
        continue;  // 비활성화된 채널 건너뛰기
    }

    // 알림 생성 및 저장
}
```

---

## 12. 테스트 시나리오

### 12.1 단위 테스트

| 대상 | 시나리오 | 검증 항목 |
|------|---------|----------|
| NotificationServiceImpl | send_defaultChannel_webPush | 채널 미지정 시 WEB_PUSH 기본값 |
| NotificationServiceImpl | send_multiChannel_createsMultiple | 3채널 지정 → 3개 Notification 생성 |
| NotificationServiceImpl | markAsRead_otherUser_throwsForbidden | 타인 알림 읽음 처리 거부 |
| NotificationServiceImpl | markAllAsRead_updatesAllUnread | 전체 읽음 처리 건수 확인 |
| NotificationServiceImpl | delete_otherUser_throwsForbidden | 타인 알림 삭제 거부 |
| NotificationServiceImpl | bulkDelete_partialOwnership_deletesOwned | 일괄 삭제 시 소유 알림만 삭제 |
| NotificationDispatcher | dispatch_sseConnected_sseSenderUsed | SSE 연결된 사용자에게 SseSender 사용 |
| NotificationDispatcher | dispatch_noSender_marksFailed | 발송자 없으면 실패 처리 |
| NotificationDispatcher | dispatch_senderFails_marksFailedWithError | 발송 실패 시 에러 메시지 저장 |
| SseSender | send_emitterExists_sendsSuccessfully | emitter 있으면 성공 |
| SseSender | send_ioException_removesEmitter | 전송 실패 시 emitter 제거 |
| EmailSender | send_noEmail_returnsFalse | 이메일 없으면 실패 |
| EmailSender | send_disabled_returnsTrue | 비활성화 시 성공 (무시) |
| TemplateRenderer | render_nestedVariable_resolves | {{employee.name}} 중첩 속성 |
| TemplateRenderer | render_missingVariable_emptyString | 없는 변수 빈 문자열 |
| NotificationTemplateService | create_duplicateCode_throwsException | 동일 코드+채널 생성 거부 |
| SseEmitterRegistry | register_replacesPrevious | 같은 유저 재등록 시 교체 |
| DomainEventListener | handleApprovalSubmitted_sendsNotification | 결재 제출 이벤트 → 알림 발송 |

### 12.2 통합 테스트

| 시나리오 | 검증 항목 |
|---------|----------|
| 멀티채널 발송 | WEB_PUSH + EMAIL 동시 발송 성공 |
| SSE 실시간 알림 | 구독 → 알림 발송 → SSE 이벤트 수신 확인 |
| 읽음 처리 후 미읽음 카운트 | 읽음 처리 → countUnread 감소 확인 |
| 전체 읽음 처리 | markAllAsRead → 미읽음 0건 확인 |
| 이메일 템플릿 렌더링 | 템플릿 변수 치환 후 이메일 본문 검증 |
| SQS 이벤트 수신 → 알림 생성 | SNS 래핑 메시지 파싱 → Notification 생성 |
| RLS 테넌트 격리 | A 테넌트 알림을 B 테넌트에서 조회 불가 |

---

## 13. 의존성

### 13.1 이 서비스를 호출하는 서비스

| 호출 서비스 | 방식 | 이벤트 | 처리 상태 |
|------------|------|--------|----------|
| approval-service | SQS (ApprovalSubmittedEvent) | 결재 요청 알림 | ✅ 구현됨 |
| approval-service | SQS (ApprovalCompletedEvent) | 결재 완료 알림 | ❌ 미구현 (NTF-G09) |
| attendance-service | SQS (LeaveRequestCreatedEvent) | 휴가 신청 알림 | ❌ TODO (NTF-G07) |
| employee-service | SQS (EmployeeCreatedEvent) | 입사 환영 알림 | ❌ TODO (NTF-G08) |

### 13.2 이 서비스가 호출하는 외부 서비스

| 대상 | 방식 | 용도 |
|------|------|------|
| SMTP 서버 | JavaMailSender | 이메일 발송 |
| (AWS SNS) | SnsClient | SMS 발송 (구현 예정) |

### 13.3 발행하는 이벤트

**없음** — notification-service는 이벤트를 구독만 하고 발행하지 않음

---

## 14. SQL 마이그레이션 요약

| 파일 | 내용 |
|------|------|
| V1__init.sql | 스키마 생성, 3개 테이블 (notifications, notification_templates, notification_preferences), RLS 정책, 인덱스, `get_current_tenant_safe()` 함수 |

**총 3개 테이블, 3개 RLS 대상 테이블**
