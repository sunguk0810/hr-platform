# SDD: Notification Service (알림 서비스)

## 1. 서비스 개요

### 1.1 목적
Notification Service는 HR SaaS 플랫폼의 모든 알림(웹 푸시, 이메일, SMS)을 통합 관리하는 서비스입니다.

### 1.2 책임 범위
- 웹 푸시 알림 발송 (Phase 1)
- 이메일 알림 발송 (AWS SES - Phase 2)
- SMS 알림 발송 (Phase 2)
- 알림 템플릿 관리
- 알림 이력 관리
- 사용자별 알림 설정 관리
- 실시간 알림 (WebSocket)

### 1.3 Phase
**Phase 1 (MVP)**: 웹 푸시 알림
**Phase 2**: 이메일 (AWS SES), SMS

---

## 2. 아키텍처

### 2.1 서비스 구조
```
┌─────────────────────────────────────────────────────────────┐
│                   Notification Service                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Web Push  │  │    Email    │  │        SMS          │ │
│  │   Handler   │  │   Handler   │  │      Handler        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Template   │  │  WebSocket  │  │     Preference      │ │
│  │   Engine    │  │   Gateway   │  │      Manager        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────┬───────────────────────────────┘
                              │
              ┌───────────────┼───────────────┬───────────────┐
              ▼               ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐    ┌──────────┐    ┌──────────┐
        │PostgreSQL│   │  Redis   │    │  Kafka   │    │ AWS SES  │
        │          │   │ (Pub/Sub)│    │ (Events) │    │  (Email) │
        └──────────┘   └──────────┘    └──────────┘    └──────────┘
```

### 2.2 의존 서비스
| 서비스 | 통신 방식 | 용도 |
|--------|----------|------|
| Employee Service | REST (OpenFeign) | 수신자 정보 (이메일, 전화번호) 조회 |
| Tenant Service | REST (OpenFeign) | 테넌트별 알림 정책 조회 |
| AWS SES | REST API | 이메일 발송 |

---

## 3. 데이터 모델

### 3.1 ERD
```
┌─────────────────────────┐       ┌─────────────────────────┐
│  notification_template  │       │      notification       │
├─────────────────────────┤       ├─────────────────────────┤
│ id (PK, UUID)           │       │ id (PK, UUID)           │
│ tenant_id               │       │ tenant_id               │
│ template_code           │       │ template_id (FK)        │
│ template_name           │       │ recipient_id            │
│ channel                 │       │ recipient_type          │
│ subject                 │       │ channel                 │
│ body                    │       │ subject                 │
│ variables               │       │ body                    │
│ status                  │       │ data                    │
│ created_at              │       │ status                  │
│ updated_at              │       │ sent_at                 │
└─────────────────────────┘       │ read_at                 │
                                  │ error_message           │
┌─────────────────────────┐       │ retry_count             │
│notification_preference  │       │ created_at              │
├─────────────────────────┤       └─────────────────────────┘
│ id (PK, UUID)           │
│ tenant_id               │       ┌─────────────────────────┐
│ employee_id             │       │   device_token          │
│ notification_type       │       ├─────────────────────────┤
│ web_push_enabled        │       │ id (PK, UUID)           │
│ email_enabled           │       │ employee_id             │
│ sms_enabled             │       │ token                   │
│ quiet_hours_start       │       │ device_type             │
│ quiet_hours_end         │       │ browser                 │
│ created_at              │       │ is_active               │
│ updated_at              │       │ last_used_at            │
└─────────────────────────┘       │ created_at              │
                                  └─────────────────────────┘
```

### 3.2 테이블 DDL

#### notification_template (알림 템플릿)
```sql
CREATE TABLE notification_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    template_code VARCHAR(100) NOT NULL,
    template_name VARCHAR(200) NOT NULL,
    channel VARCHAR(20) NOT NULL
        CHECK (channel IN ('WEB_PUSH', 'EMAIL', 'SMS', 'ALL')),
    subject VARCHAR(500),
    body TEXT NOT NULL,
    body_html TEXT,
    variables JSONB DEFAULT '[]',
    is_system BOOLEAN DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_notification_template UNIQUE (tenant_id, template_code, channel)
);

-- 시스템 템플릿 예시
-- APPROVAL_REQUESTED: 결재 요청
-- APPROVAL_APPROVED: 결재 승인
-- APPROVAL_REJECTED: 결재 반려
-- LEAVE_APPROVED: 휴가 승인
-- WORK_HOUR_WARNING: 근무시간 경고
```

#### notification (알림)
```sql
CREATE TABLE notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    template_id UUID REFERENCES notification_template(id),
    recipient_id UUID NOT NULL,
    recipient_type VARCHAR(20) NOT NULL DEFAULT 'EMPLOYEE'
        CHECK (recipient_type IN ('EMPLOYEE', 'GROUP', 'DEPARTMENT', 'ALL')),
    channel VARCHAR(20) NOT NULL
        CHECK (channel IN ('WEB_PUSH', 'EMAIL', 'SMS')),
    subject VARCHAR(500),
    body TEXT NOT NULL,
    data JSONB,
    link_url VARCHAR(1000),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_retry_count CHECK (retry_count <= 3)
) PARTITION BY RANGE (created_at);

-- 월별 파티셔닝
CREATE TABLE notification_2024_01 PARTITION OF notification
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- 인덱스
CREATE INDEX idx_notification_recipient ON notification(recipient_id, status);
CREATE INDEX idx_notification_status ON notification(status, created_at);
CREATE INDEX idx_notification_pending ON notification(status, next_retry_at) 
    WHERE status IN ('PENDING', 'FAILED');

-- RLS 정책
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_isolation ON notification
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

#### notification_preference (알림 설정)
```sql
CREATE TABLE notification_preference (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    web_push_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_notification_preference UNIQUE (tenant_id, employee_id, notification_type)
);

-- 알림 유형 예시
-- APPROVAL: 결재 관련
-- LEAVE: 휴가 관련
-- ATTENDANCE: 근태 관련
-- ANNOUNCEMENT: 공지사항
-- SYSTEM: 시스템 알림
```

#### device_token (디바이스 토큰)
```sql
CREATE TABLE device_token (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    token TEXT NOT NULL,
    device_type VARCHAR(20) NOT NULL
        CHECK (device_type IN ('WEB', 'ANDROID', 'IOS')),
    browser VARCHAR(50),
    os_version VARCHAR(50),
    app_version VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_device_token UNIQUE (employee_id, token)
);
```

---

## 4. API 명세

### 4.1 알림 발송 API

#### 알림 발송 (단일)
```
POST /api/v1/notifications/send
```
**Request:**
```json
{
  "templateCode": "APPROVAL_REQUESTED",
  "recipientId": "uuid",
  "channel": "WEB_PUSH",
  "data": {
    "approvalTitle": "연차 휴가 신청",
    "requesterName": "홍길동",
    "approvalId": "uuid"
  },
  "linkUrl": "/approvals/uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notificationId": "uuid",
    "status": "SENT",
    "sentAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 알림 발송 (대량)
```
POST /api/v1/notifications/send-bulk
```
**Request:**
```json
{
  "templateCode": "ANNOUNCEMENT",
  "recipientType": "DEPARTMENT",
  "recipientId": "dept-uuid",
  "channel": "ALL",
  "data": {
    "title": "공지사항",
    "content": "시스템 점검 안내"
  }
}
```

### 4.2 알림 조회 API

#### 내 알림 목록
```
GET /api/v1/notifications/my
```
**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| status | String | N | READ, UNREAD, ALL |
| channel | String | N | WEB_PUSH, EMAIL, SMS |
| page | Integer | N | 페이지 |
| size | Integer | N | 크기 (default: 20) |

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "uuid",
        "subject": "결재 요청",
        "body": "홍길동님이 연차 휴가를 신청했습니다.",
        "channel": "WEB_PUSH",
        "linkUrl": "/approvals/uuid",
        "status": "DELIVERED",
        "readAt": null,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "unreadCount": 5,
    "totalElements": 50
  }
}
```

#### 읽지 않은 알림 수
```
GET /api/v1/notifications/my/unread-count
```
**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

#### 알림 읽음 처리
```
POST /api/v1/notifications/{notificationId}/read
```

#### 알림 전체 읽음 처리
```
POST /api/v1/notifications/my/read-all
```

### 4.3 알림 설정 API

#### 알림 설정 조회
```
GET /api/v1/notifications/preferences
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "notificationType": "APPROVAL",
      "notificationTypeName": "결재 알림",
      "webPushEnabled": true,
      "emailEnabled": true,
      "smsEnabled": false
    },
    {
      "notificationType": "LEAVE",
      "notificationTypeName": "휴가 알림",
      "webPushEnabled": true,
      "emailEnabled": false,
      "smsEnabled": false
    }
  ],
  "quietHours": {
    "enabled": true,
    "start": "22:00",
    "end": "08:00"
  }
}
```

#### 알림 설정 수정
```
PUT /api/v1/notifications/preferences
```
**Request:**
```json
{
  "preferences": [
    {
      "notificationType": "APPROVAL",
      "webPushEnabled": true,
      "emailEnabled": false,
      "smsEnabled": false
    }
  ],
  "quietHours": {
    "enabled": true,
    "start": "22:00",
    "end": "08:00"
  }
}
```

### 4.4 디바이스 토큰 API

#### 디바이스 토큰 등록
```
POST /api/v1/notifications/devices
```
**Request:**
```json
{
  "token": "fcm-token-xxx",
  "deviceType": "WEB",
  "browser": "Chrome",
  "osVersion": "Windows 11"
}
```

#### 디바이스 토큰 삭제
```
DELETE /api/v1/notifications/devices/{tokenId}
```

### 4.5 템플릿 API (관리자)

#### 템플릿 목록
```
GET /api/v1/notifications/templates
```

#### 템플릿 생성
```
POST /api/v1/notifications/templates
```
**Request:**
```json
{
  "templateCode": "CUSTOM_NOTICE",
  "templateName": "커스텀 공지",
  "channel": "EMAIL",
  "subject": "[{{companyName}}] {{title}}",
  "body": "안녕하세요, {{recipientName}}님.\n\n{{content}}\n\n감사합니다.",
  "bodyHtml": "<html>...</html>",
  "variables": ["companyName", "title", "recipientName", "content"]
}
```

#### 템플릿 미리보기
```
POST /api/v1/notifications/templates/{templateId}/preview
```
**Request:**
```json
{
  "data": {
    "companyName": "HR SaaS",
    "title": "테스트 공지",
    "recipientName": "홍길동",
    "content": "테스트 내용입니다."
  }
}
```

---

## 5. 비즈니스 로직

### 5.1 알림 발송 처리

```java
@Service
@RequiredArgsConstructor
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    private final NotificationTemplateRepository templateRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final DeviceTokenRepository deviceTokenRepository;
    private final WebPushService webPushService;
    private final EmailService emailService;
    private final TemplateEngine templateEngine;
    
    @Transactional
    public NotificationResult sendNotification(NotificationRequest request) {
        UUID tenantId = SecurityContextHolder.getCurrentTenantId();
        
        // 1. 템플릿 조회
        NotificationTemplate template = templateRepository
            .findByTenantIdAndTemplateCode(tenantId, request.getTemplateCode())
            .orElseGet(() -> templateRepository
                .findSystemTemplate(request.getTemplateCode())
                .orElseThrow(() -> new NotFoundException("템플릿을 찾을 수 없습니다.")));
        
        // 2. 수신자 알림 설정 확인
        NotificationPreference preference = preferenceRepository
            .findByEmployeeIdAndType(request.getRecipientId(), 
                extractNotificationType(request.getTemplateCode()))
            .orElse(NotificationPreference.defaultPreference());
        
        // 3. 채널별 발송 가능 여부 확인
        List<String> enabledChannels = getEnabledChannels(request.getChannel(), preference);
        
        if (enabledChannels.isEmpty()) {
            return NotificationResult.skipped("수신자가 알림을 비활성화했습니다.");
        }
        
        // 4. 방해 금지 시간 확인
        if (isQuietHours(preference)) {
            // 방해 금지 시간 종료 후 발송 예약
            return scheduleAfterQuietHours(request, preference);
        }
        
        // 5. 템플릿 렌더링
        String subject = templateEngine.render(template.getSubject(), request.getData());
        String body = templateEngine.render(template.getBody(), request.getData());
        
        List<NotificationResult> results = new ArrayList<>();
        
        // 6. 채널별 발송
        for (String channel : enabledChannels) {
            Notification notification = createNotification(
                tenantId, template, request, channel, subject, body
            );
            
            try {
                switch (channel) {
                    case "WEB_PUSH" -> sendWebPush(notification);
                    case "EMAIL" -> sendEmail(notification, template.getBodyHtml(), request.getData());
                    case "SMS" -> sendSms(notification);
                }
                
                notification.setStatus(NotificationStatus.SENT);
                notification.setSentAt(LocalDateTime.now());
                results.add(NotificationResult.success(notification.getId(), channel));
                
            } catch (Exception e) {
                notification.setStatus(NotificationStatus.FAILED);
                notification.setErrorMessage(e.getMessage());
                notification.setNextRetryAt(calculateNextRetry(notification.getRetryCount()));
                results.add(NotificationResult.failed(notification.getId(), channel, e.getMessage()));
            }
            
            notificationRepository.save(notification);
        }
        
        return NotificationResult.combined(results);
    }
    
    private void sendWebPush(Notification notification) {
        List<DeviceToken> tokens = deviceTokenRepository
            .findActiveByEmployeeId(notification.getRecipientId());
        
        for (DeviceToken token : tokens) {
            webPushService.send(WebPushMessage.builder()
                .token(token.getToken())
                .title(notification.getSubject())
                .body(notification.getBody())
                .icon("/icons/notification.png")
                .clickAction(notification.getLinkUrl())
                .data(notification.getData())
                .build());
            
            // 토큰 사용 시간 업데이트
            token.setLastUsedAt(LocalDateTime.now());
            deviceTokenRepository.save(token);
        }
    }
    
    private void sendEmail(Notification notification, String htmlTemplate, 
                          Map<String, Object> data) {
        EmployeeDto employee = employeeServiceClient.getEmployee(notification.getRecipientId());
        
        String htmlBody = templateEngine.render(htmlTemplate, data);
        
        emailService.send(EmailMessage.builder()
            .to(employee.getEmail())
            .subject(notification.getSubject())
            .bodyText(notification.getBody())
            .bodyHtml(htmlBody)
            .build());
    }
    
    private boolean isQuietHours(NotificationPreference preference) {
        if (preference.getQuietHoursStart() == null || preference.getQuietHoursEnd() == null) {
            return false;
        }
        
        LocalTime now = LocalTime.now();
        LocalTime start = preference.getQuietHoursStart();
        LocalTime end = preference.getQuietHoursEnd();
        
        if (start.isBefore(end)) {
            return now.isAfter(start) && now.isBefore(end);
        } else {
            // 자정을 넘는 경우 (예: 22:00 ~ 08:00)
            return now.isAfter(start) || now.isBefore(end);
        }
    }
}
```

### 5.2 WebSocket 실시간 알림

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/notifications")
            .setAllowedOriginPatterns("*")
            .withSockJS();
    }
}

@Service
@RequiredArgsConstructor
public class WebSocketNotificationService {
    
    private final SimpMessagingTemplate messagingTemplate;
    
    public void sendToUser(UUID userId, NotificationDto notification) {
        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/queue/notifications",
            notification
        );
    }
    
    public void sendToTenant(UUID tenantId, NotificationDto notification) {
        messagingTemplate.convertAndSend(
            "/topic/tenant/" + tenantId + "/notifications",
            notification
        );
    }
    
    public void updateUnreadCount(UUID userId, int count) {
        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/queue/unread-count",
            Map.of("count", count)
        );
    }
}
```

### 5.3 알림 재시도 처리

```java
@Service
@RequiredArgsConstructor
public class NotificationRetryService {
    
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    
    private static final int MAX_RETRY_COUNT = 3;
    private static final int[] RETRY_DELAYS_MINUTES = {5, 15, 60};
    
    @Scheduled(fixedDelay = 60000) // 1분마다
    @Transactional
    public void processRetry() {
        List<Notification> failedNotifications = notificationRepository
            .findFailedNotificationsForRetry(LocalDateTime.now());
        
        for (Notification notification : failedNotifications) {
            if (notification.getRetryCount() >= MAX_RETRY_COUNT) {
                notification.setStatus(NotificationStatus.CANCELLED);
                notification.setErrorMessage("최대 재시도 횟수 초과");
                notificationRepository.save(notification);
                continue;
            }
            
            try {
                notificationService.retrySend(notification);
                
                notification.setStatus(NotificationStatus.SENT);
                notification.setSentAt(LocalDateTime.now());
                notification.setErrorMessage(null);
                
            } catch (Exception e) {
                notification.setRetryCount(notification.getRetryCount() + 1);
                notification.setNextRetryAt(calculateNextRetry(notification.getRetryCount()));
                notification.setErrorMessage(e.getMessage());
            }
            
            notificationRepository.save(notification);
        }
    }
    
    private LocalDateTime calculateNextRetry(int retryCount) {
        if (retryCount >= RETRY_DELAYS_MINUTES.length) {
            return null;
        }
        return LocalDateTime.now().plusMinutes(RETRY_DELAYS_MINUTES[retryCount]);
    }
}
```

### 5.4 Kafka 이벤트 소비

```java
@Service
@RequiredArgsConstructor
public class NotificationEventConsumer {
    
    private final NotificationService notificationService;
    
    @KafkaListener(topics = "hr-saas.notification.send")
    public void handleNotificationRequest(NotificationEvent event) {
        NotificationRequest request = NotificationRequest.builder()
            .templateCode(event.getTemplateCode())
            .recipientId(event.getRecipientId())
            .channel(event.getChannel())
            .data(event.getData())
            .linkUrl(event.getLinkUrl())
            .build();
        
        notificationService.sendNotification(request);
    }
    
    @KafkaListener(topics = "hr-saas.approval.completed")
    public void handleApprovalCompleted(ApprovalCompletedEvent event) {
        String templateCode = event.isApproved() ? 
            "APPROVAL_APPROVED" : "APPROVAL_REJECTED";
        
        NotificationRequest request = NotificationRequest.builder()
            .templateCode(templateCode)
            .recipientId(event.getRequesterId())
            .channel("WEB_PUSH")
            .data(Map.of(
                "approvalTitle", event.getTitle(),
                "approverName", event.getApproverName(),
                "approvalId", event.getApprovalId().toString()
            ))
            .linkUrl("/approvals/" + event.getApprovalId())
            .build();
        
        notificationService.sendNotification(request);
    }
}
```

---

## 6. 이벤트

### 6.1 구독 이벤트

| 이벤트 | 토픽 | 처리 내용 |
|--------|------|----------|
| NotificationEvent | hr-saas.notification.send | 알림 발송 |
| ApprovalCompletedEvent | hr-saas.approval.completed | 결재 완료 알림 |
| LeaveApprovedEvent | hr-saas.attendance.leave-approved | 휴가 승인 알림 |
| WorkHourExceededEvent | hr-saas.attendance.work-hour-exceeded | 근무시간 초과 알림 |

---

## 7. 보안

### 7.1 권한 매트릭스

| API | 관리자 | 일반 사용자 |
|-----|--------|------------|
| 알림 발송 | ✅ | ❌ |
| 내 알림 조회 | ✅ | ✅ |
| 알림 설정 | ✅ | ✅ (본인만) |
| 템플릿 관리 | ✅ | ❌ |

---

## 8. 성능 최적화

### 8.1 캐싱 전략

| 데이터 | 캐시 TTL | 무효화 조건 |
|--------|---------|------------|
| 템플릿 | 1시간 | 템플릿 수정 시 |
| 알림 설정 | 30분 | 설정 변경 시 |
| 디바이스 토큰 | 1시간 | 토큰 등록/삭제 시 |

### 8.2 대량 발송 최적화

```java
@Service
@RequiredArgsConstructor
public class BulkNotificationService {
    
    private final NotificationRepository notificationRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    @Async
    public void sendBulkNotification(BulkNotificationRequest request) {
        List<UUID> recipientIds = resolveRecipients(request);
        
        // 배치 단위로 Kafka에 발행
        int batchSize = 100;
        for (int i = 0; i < recipientIds.size(); i += batchSize) {
            List<UUID> batch = recipientIds.subList(i, 
                Math.min(i + batchSize, recipientIds.size()));
            
            for (UUID recipientId : batch) {
                kafkaTemplate.send("hr-saas.notification.send",
                    NotificationEvent.builder()
                        .templateCode(request.getTemplateCode())
                        .recipientId(recipientId)
                        .data(request.getData())
                        .build());
            }
        }
    }
}
```

---

## 9. 모니터링

### 9.1 메트릭

```yaml
# Prometheus 메트릭
- name: notification_sent_total
  type: counter
  labels: [tenant_id, channel, template_code, status]
  description: 발송된 알림 수

- name: notification_delivery_time_seconds
  type: histogram
  labels: [channel]
  description: 알림 전송 시간

- name: notification_retry_total
  type: counter
  labels: [channel]
  description: 재시도 횟수
```

---

## 10. 배포 설정

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-service
  namespace: hr-saas
spec:
  replicas: 2
  selector:
    matchLabels:
      app: notification-service
  template:
    spec:
      containers:
        - name: notification-service
          image: hr-saas/notification-service:latest
          ports:
            - containerPort: 8080
          env:
            - name: AWS_SES_REGION
              value: "ap-northeast-2"
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
```

---

## 11. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2024-01-15 | - | 최초 작성 |