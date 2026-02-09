# ADR-002: Kafka에서 AWS SQS/SNS로 전환

> **상태**: 수락됨
> **날짜**: 2025-03
> **관련 ADR**: 없음

---

## 컨텍스트

초기 설계에서 서비스 간 비동기 통신을 Apache Kafka 3.x (Amazon MSK)로 계획했습니다. 그러나 프로젝트 초기 개발 과정에서 운영 복잡도와 비용 대비 실제 트래픽 규모의 불일치가 확인되었습니다.

### 현재 상황

- 팀 규모: 3인 이하
- 예상 초기 트래픽: 수백~수천 msg/일 (Kafka가 설계된 수백만 msg/s 대비 극히 낮음)
- 이벤트 패턴: Fan-out (1→N), 요청-응답 없음, 단순 이벤트 알림
- 초기 SDD 문서 9개가 Kafka 기반으로 작성됨 (`docs/deprecated/`)

---

## 고려한 대안

### 대안 1: Apache Kafka (Amazon MSK) 유지

초기 설계대로 Kafka를 사용합니다.

- **장점**:
  - 수백만 msg/s 처리 가능 (미래 확장성)
  - Exactly-once 의미론 지원
  - 파티션 기반 순서 보장
  - 이벤트 소싱/CQRS에 적합
  - 메시지 보존 (재처리 가능)
- **단점**:
  - 최소 3 Broker 필요 (MSK $0.21/h × 3 = 월 ~$450)
  - ZooKeeper/KRaft 관리
  - 파티션 리밸런싱, ISR, 로그 보존 정책 운영
  - 로컬 개발: Docker Kafka + KafkaUI (메모리 ~1.5GB)
  - 3인 팀에 과도한 운영 부담

### 대안 2: AWS SQS + SNS

SNS(발행) + SQS(소비) 조합으로 Fan-out 메시징을 구현합니다.

- **장점**:
  - 완전 관리형 (운영 부담 제로)
  - 종량제 (100만 요청 = $0.40, 초기 비용 ~$5/월)
  - DLQ 내장 (실패 메시지 자동 이동)
  - LocalStack으로 로컬 개발 완전 지원 (메모리 ~200MB)
  - 학습 곡선 낮음
- **단점**:
  - At-least-once 의미론만 (소비자 멱등성 필수)
  - 처리량 상한: FIFO 큐 300 TPS, Standard 큐 수만 TPS
  - 메시지 보존 최대 14일
  - 이벤트 소싱에 부적합

### 대안 3: RabbitMQ

전통적인 메시지 브로커를 사용합니다.

- **장점**:
  - 가벼운 설치, 다양한 교환 패턴
  - AMQP 표준 프로토콜
- **단점**:
  - 자체 운영 필요 (또는 AmazonMQ 비용)
  - 클러스터링 설정 복잡
  - AWS 네이티브 통합 부족

---

## 결정

**대안 2: AWS SQS + SNS**를 선택합니다.

### 결정 근거

1. **비용**: 월 ~$5 vs ~$450 (Kafka MSK)
2. **운영 부담**: 제로 vs Broker/ZooKeeper 관리
3. **팀 규모**: 3인 팀에서 Kafka 운영은 비현실적
4. **트래픽**: 현재 수백 msg/일 수준에서 Kafka 과잉 설계
5. **로컬 개발**: LocalStack 경량 에뮬레이션 (200MB vs 1.5GB)
6. **인터페이스 추상화**: `EventPublisher` 인터페이스로 구현체 교체 가능

### 코드 영향

```
변경된 모듈:
- common/common-event/ → SnsEventPublisher (KafkaTemplate → SnsTemplate)
- docker/localstack/   → init-aws.sh (토픽/큐 초기화)
- 각 서비스 application.yml → spring-cloud-aws 설정

영향 없는 부분:
- DomainEvent 인터페이스 동일
- EventPublisher 인터페이스 동일
- 비즈니스 로직 변경 없음
```

---

## 결과

### 긍정적 결과

- 7개 SNS 토픽 + 5개 SQS 큐 + 5개 DLQ 구성 완료
- 로컬 개발: `docker/localstack/init-aws.sh`로 자동 초기화
- 인프라 비용 90% 절감 (월 $450 → $5)
- 운영 부담 제거 (완전 관리형)
- `EventPublisher` 인터페이스 덕분에 비즈니스 로직 변경 없음

### 부정적 결과 / 트레이드오프

- At-least-once 의미론 → 소비자에서 `eventId` 기반 멱등성 처리 필수
- 메시지 순서: FIFO 큐 사용 시 300 TPS 제한 (현재 Standard 큐 사용)
- 이벤트 소싱 패턴 적용 불가 (메시지 14일 보존 제한)
- SDD 9개 문서의 Kafka 관련 내용 무효화 → `docs/deprecated/` 이동

### 향후 고려사항

- 트래픽이 수만 TPS에 도달하면 Kafka 재도입 검토
- 이벤트 소싱/CQRS 패턴 필요 시 Kafka 또는 DynamoDB Streams 검토
- `KafkaEventPublisher` 구현체를 추가하고 프로파일로 전환하면 코드 변경 최소화

---

## 관련 문서

| 문서 | 설명 |
|------|------|
| [EVENT_ARCHITECTURE.md](../architecture/EVENT_ARCHITECTURE.md) | SNS/SQS 현재 구현 상세 |
| [MIGRATION_GUIDE.md](../architecture/MIGRATION_GUIDE.md) | Kafka → SQS 전환 비교 |
| [deprecated/README.md](../deprecated/README.md) | 초기 Kafka 기반 SDD 문서 안내 |
