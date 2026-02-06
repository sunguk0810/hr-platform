# Module 10: Recruitment Service (채용관리)

> 분석일: 2026-02-06
> 포트: 8093
> 패키지: `com.hrsaas.recruitment`
> DB 스키마: `hr_recruitment`

---

## 1. 현재 구현 상태 요약

### 1.1 완료된 기능

| 기능 | 상태 | 설명 |
|------|------|------|
| 채용공고 CRUD | ✅ 완료 | JobPosting 생성/수정/삭제, 상태 전이(DRAFT→PUBLISHED→CLOSED→COMPLETED) |
| 공고 검색/필터 | ✅ 완료 | 키워드 검색, 상태·부서·담당자별 필터, 페이지네이션 |
| 공개 공고 API | ✅ 완료 | 비인증 사용자도 활성 공고 조회/검색 가능 (`/public/active`, `/public/search`) |
| 지원자(Applicant) CRUD | ✅ 완료 | 이메일 유니크, 개인정보 마스킹(이름·이메일·전화·주소) |
| 지원서(Application) 제출 | ✅ 완료 | 중복 지원 방지, 블랙리스트 차단, 지원번호 자동채번 |
| 서류심사(Screening) | ✅ 완료 | 합격/불합격 처리, 점수(0-100) + 심사코멘트 |
| 면접(Interview) CRUD | ✅ 완료 | 면접 생성/일정/시작/완료/취소/연기/노쇼 상태관리 |
| 면접 평가(InterviewScore) | ✅ 완료 | 면접관별 항목별 평가, 가중치 적용, 평균점수 산출 |
| 오퍼(Offer) 관리 | ✅ 완료 | 오퍼 생성/승인/발송/수락/거절/협상/만료/취소 상태머신 |
| 채용 통계 | ✅ 완료 | RecruitmentStatisticsResponse — 공고·지원·면접·오퍼 집계 + 전환율 |
| 공고 자동 마감 | ✅ 완료 | RecruitmentScheduler: 매일 00:05 마감일 경과 공고 CLOSED 처리 |
| 오퍼 만료 처리 | ✅ 완료 | RecruitmentScheduler: 매일 01:00 SENT 상태 오퍼 만료 확인 |
| RLS | ✅ 완료 | 전 테이블 tenant_id 기반 Row Level Security |
| 개인정보 마스킹 | ✅ 완료 | ApplicantResponse에 @Masked 적용 (NAME, EMAIL, PHONE, ADDRESS) |
| Redis 캐시 | ✅ 완료 | JobPosting 상세 조회 캐시, 변경 시 evict |
| JSONB 컬럼 | ✅ 완료 | skills, education, experience, interviewers, benefits 등 유연한 데이터 저장 |
| 공고 조회수 | ✅ 완료 | 상세 조회 시 viewCount 자동 증가 |

### 1.2 미구현 / 갭

| 갭 ID | 기능 | 우선순위 | 설명 |
|--------|------|----------|------|
| REC-G01 | 공고별 채용 단계 커스텀 | HIGH | interviewProcess JSONB 존재하나 실제 단계 검증·제어 없음 → **정책결정: 공고별 커스텀** (§2.1) |
| REC-G02 | 면접유형별 평가항목 | HIGH | criterion 자유 문자열 → **정책결정: 유형별 고정 세트** (§2.2) |
| REC-G03 | 입사 전환 자동화 | HIGH | hire() 호출 시 Employee Service 연동 없음 → **정책결정: 이벤트 기반 자동 생성** (§2.3) |
| REC-G04 | 개인정보 자동 파기 | HIGH | 보존 기간 관리·자동 삭제 없음 → **정책결정: 1년 후 자동삭제** (§2.4) |
| REC-G05 | Approval Service 연동 | HIGH | 오퍼 승인이 자체 상태변경만 → **정책결정: Approval 엔진 연동** (§2.5) |
| REC-G06 | 그룹 공유 블랙리스트 | MEDIUM | 테넌트 단위 블랙리스트 → **정책결정: 그룹(계열사) 간 공유** (§2.6) |
| REC-G07 | 외부 채널 연동 API | MEDIUM | 외부 채용사이트 게시 API 없음 → **정책결정: 향후 확장 고려 설계** (§2.7) |
| REC-G08 | 면접 리마인더 | MEDIUM | sendInterviewReminders() TODO 스텁 — 구현 필요 |
| REC-G09 | 피드백 리마인더 | MEDIUM | sendFeedbackReminders() TODO 스텁 — 구현 필요 |
| REC-G10 | 합격기준 자동판정 | LOW | 면접 점수 기반 자동 합격/불합격 판정 없음 (수동 처리만) |
| REC-G11 | FE-BE 상태/유형 불일치 | HIGH | FE와 BE 간 enum 값 불일치 다수 (§3.1) |
| REC-G12 | FE-BE 엔드포인트 불일치 | HIGH | FE service URL과 BE controller URL 불일치 (§3.2) |
| REC-G13 | ddl-auto: update | HIGH | 프로덕션 위험 — Flyway 사용 중인데 ddl-auto가 update (§5.2) |

---

## 2. 정책 결정사항

### 2.1 채용 프로세스 단계 커스텀 ✅ 결정완료

> **결정: 공고(JobPosting)별 커스텀 단계**

- JobPosting의 `interviewProcess` (JSONB List<Map>)를 **공식 채용 단계 정의**로 활용
- 구조:
  ```json
  [
    {"order": 1, "stage": "DOCUMENT", "name": "서류심사", "required": true},
    {"order": 2, "stage": "FIRST_INTERVIEW", "name": "1차 기술면접", "required": true},
    {"order": 3, "stage": "SECOND_INTERVIEW", "name": "2차 임원면접", "required": false},
    {"order": 4, "stage": "OFFER", "name": "오퍼", "required": true}
  ]
- Application의 `currentStage`와 `stageOrder`가 이 프로세스 정의를 참조
- `moveToNextStage()` 시 정의된 순서대로만 진행 가능하도록 검증 추가 필요
- FE: 현재 고정 5단계 → 공고의 `interviewProcess`를 읽어 동적 렌더링으로 변경
- **기본 템플릿**: 공고 생성 시 기본 5단계 프로세스 자동 세팅 (편의)

### 2.2 면접유형별 고정 평가항목 ✅ 결정완료

> **결정: 면접 유형(InterviewType)별 고정 평가항목 세트**

- MDM 코드 또는 서비스 내 설정으로 유형별 평가항목 정의:

| 면접 유형 | 평가항목 | 배점 | 가중치 |
|-----------|---------|------|--------|
| TECHNICAL | 기술 지식, 문제 해결력, 코딩 능력, 시스템 설계, 학습 능력 | 각 10점 | 균등 |
| PERSONALITY | 소통 능력, 조직 적합도, 리더십, 동기/열정, 협업 능력 | 각 10점 | 균등 |
| FINAL | 전략적 사고, 비전 적합도, 리더십, 조직 적합도, 종합 평가 | 각 10점 | 균등 |
| PHONE / VIDEO | 소통 능력, 기술 기본기, 관심도/열정, 경력 적합성, 종합 | 각 10점 | 균등 |
| PRESENTATION | 프레젠테이션 능력, 내용 충실도, Q&A 대응, 논리성, 종합 | 각 10점 | 균등 |
| GROUP | 토론 참여도, 리더십, 경청/협력, 논리적 표현, 종합 | 각 10점 | 균등 |

- 면접 생성 시 유형에 맞는 평가항목 자동 세팅
- FE의 현재 5개 고정항목(기술력, 소통, 조직적합도, 문제해결, 종합) → 면접 유형에 따라 동적 렌더링
- `InterviewScore.criterion`은 정의된 항목명과 일치해야 함 (검증 추가)
- `maxScore`: 기본 10점 (현재 BE 기본값 5 → 10으로 변경)

### 2.3 입사 전환 자동화 ✅ 결정완료

> **결정: HIRED 상태 변경 시 이벤트 발행 → Employee Service 자동 생성**

- `ApplicationServiceImpl.hire()` 실행 시:
  1. Application 상태를 HIRED로 변경
  2. `RecruitmentHiredEvent` 도메인 이벤트 발행 (SNS/SQS)
  3. Employee Service가 이벤트를 수신하여 신규 직원 레코드 자동 생성
- 이벤트 페이로드:
  ```json
  {
    "eventType": "recruitment.hired",
    "applicationId": "...",
    "applicantName": "...",
    "applicantEmail": "...",
    "applicantPhone": "...",
    "departmentId": "...",
    "positionTitle": "...",
    "gradeCode": "...",
    "startDate": "2024-04-01",
    "employmentType": "FULL_TIME",
    "baseSalary": 55000000,
    "tenantId": "..."
  }
  ```
- Employee Service 수신 후: `PRE_ONBOARDING` 상태로 직원 생성 + 발령(Appointment) 자동 생성
- 실패 시: DLQ(Dead Letter Queue)로 이동, HR 담당자에게 알림 발송

### 2.4 개인정보 자동 파기 ✅ 결정완료

> **결정: 불합격/미채용 지원자 개인정보 1년 후 자동 삭제**

- 대상: Application 상태가 REJECTED, SCREENING_REJECTED, INTERVIEW_REJECTED, WITHDRAWN인 건
- 기준일: 상태 변경일 (`rejectedAt` 또는 `withdrawnAt`) + 1년
- 파기 범위:
  - Applicant: name, email, phone, birthDate, address → 익명화 (`***` 처리)
  - Applicant: resumeFileId → File Service에 삭제 요청, 필드 null 처리
  - Applicant: education, experience, certificates, languages → 빈 배열
  - Application: coverLetter, answers → null 처리
  - InterviewScore: comment → null 처리
- 파기 방식: **익명화** (레코드 유지, 통계 보존) — 물리 삭제 아님
- 스케줄러: 매일 02:00 실행, 대상자 일괄 익명화
- 감사 로그: 파기 실행 이력 기록 (파기 건수, 실행 시각)
- 인재풀 등록자: 지원자가 인재풀 동의 시 보존 기간 연장 (향후 확장)

### 2.5 Approval Service 연동 (오퍼 결재) ✅ 결정완료

> **결정: Approval Service 결재 엔진과 연동**

- 오퍼 `submitForApproval()` 호출 시:
  1. Offer 상태를 PENDING_APPROVAL로 변경
  2. Approval Service에 결재 요청 생성 (Feign Client 또는 이벤트)
  3. 결재 완료 이벤트 수신 시 Offer 상태를 APPROVED로 변경
- 결재 라인 기준:
  - 오퍼 연봉(baseSalary) 기준 결재 라인 자동 결정
  - 예: 5천만 이하 → HR팀장 1단계, 1억 이하 → HR팀장+본부장 2단계, 1억 초과 → 3단계(+대표이사)
  - 구체적 금액 기준은 테넌트 정책으로 관리
- 결재 양식:
  ```
  제목: [채용] {positionTitle} 오퍼 승인 요청 - {applicantName}
  본문: 포지션, 연봉, 사이닝보너스, 입사일, 특별조건 등
  첨부: Offer 상세 정보 링크
  ```
- 결재 결과 콜백:
  - 승인 → Offer.approve() 실행
  - 반려 → Offer 상태를 DRAFT로 되돌림 + 사유 저장

### 2.6 그룹 공유 블랙리스트 ✅ 결정완료

> **결정: 그룹(계열사) 간 블랙리스트 공유**

- 현재 구조 변경:
  - `applicants.is_blacklisted` + `blacklist_reason` → 별도 `blacklist_entries` 테이블 분리
  - 새 테이블 구조:
    ```sql
    CREATE TABLE blacklist_entries (
      id UUID PRIMARY KEY,
      group_id VARCHAR(50) NOT NULL,    -- 그룹사 ID (tenant group)
      applicant_email VARCHAR(200) NOT NULL,
      reason TEXT NOT NULL,
      type VARCHAR(50),                 -- INTERVIEW_ABSENCE, FALSE_RESUME, MISCONDUCT 등
      registered_by UUID NOT NULL,
      registered_tenant_id VARCHAR(50), -- 등록한 계열사
      effective_from TIMESTAMP,
      effective_until TIMESTAMP,        -- NULL = 영구
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP,
      updated_at TIMESTAMP
    );
    ```
  - 지원 시 그룹 내 모든 계열사의 블랙리스트 확인
  - 블랙리스트 등록/해제 시 그룹 내 타 계열사에 알림 발송
- Tenant Service 연동: group_id 조회를 위한 Feign Client
- 조회 API: 그룹 전체 블랙리스트, 자사 등록 건, 이력 조회

### 2.7 외부 채널 연동 설계 ✅ 결정완료

> **결정: Phase 2 향후 확장, 현재는 API 인터페이스만 설계**

- 확장 포인트 설계:
  - `ExternalChannelService` 인터페이스 정의 (publish, withdraw, sync)
  - JobPosting에 `externalChannels` JSONB 필드 추가 (향후)
  - 채널 유형: JOBKOREA, SARAMIN, LINKEDIN, WANTED 등 enum 정의만
- 현재 구현: 내부 공개 공고 API만 (`/public/active`, `/public/search`)
- Phase 2 구현 시: 어댑터 패턴으로 채널별 구현체 추가

---

## 3. FE-BE 불일치 분석

### 3.1 상태/유형 Enum 불일치

| 구분 | FE (shared-types) | BE (enum) | 조치 |
|------|-------------------|-----------|------|
| 공고 상태 | DRAFT, **OPEN**, CLOSED, COMPLETED | DRAFT, **PUBLISHED**, CLOSED, CANCELLED, COMPLETED | **OPEN→PUBLISHED 통일** (BE 기준), FE에 CANCELLED 추가 |
| 지원 상태 | RECEIVED, SCREENING, IN_PROGRESS, PASSED, FAILED, HIRED, WITHDRAWN | SUBMITTED, SCREENING, SCREENED, SCREENING_REJECTED, INTERVIEWING, INTERVIEW_PASSED, INTERVIEW_REJECTED, OFFER_PENDING, HIRED, WITHDRAWN, REJECTED | **BE 상태가 세분화됨** — FE를 BE 기준으로 확장하되, UI에서는 그룹핑 표시 |
| 면접 유형 | PHONE, VIDEO, ONSITE, TECHNICAL, FINAL | FIRST_ROUND, SECOND_ROUND, FINAL_ROUND, TECHNICAL, PERSONALITY, PRESENTATION, GROUP, VIDEO, PHONE | **BE가 9종으로 풍부** — FE에 나머지 유형 추가, ONSITE 제거(BE에 없음) |
| 면접 상태 | SCHEDULED, CONFIRMED, COMPLETED, CANCELLED | SCHEDULING, SCHEDULED, IN_PROGRESS, COMPLETED, NO_SHOW, CANCELLED, POSTPONED | **BE가 세분화** — FE에 SCHEDULING, IN_PROGRESS, NO_SHOW, POSTPONED 추가, CONFIRMED 제거(BE에 없음) |
| 고용 유형 | FULL_TIME, CONTRACT, INTERN, PART_TIME | FULL_TIME, CONTRACT, INTERN, PART_TIME, FREELANCE, EXECUTIVE | FE에 FREELANCE, EXECUTIVE 추가 |
| 오퍼 상태 | FE: SENT 정도만 mock | DRAFT, PENDING_APPROVAL, APPROVED, SENT, ACCEPTED, DECLINED, NEGOTIATING, EXPIRED, CANCELLED | FE에 전체 상태 추가 |

### 3.2 엔드포인트 URL 불일치

| 기능 | FE (service URL) | BE (controller URL) | 조치 |
|------|-------------------|---------------------|------|
| 공고 요약 | `GET /jobs/summary` | **없음** | BE에 summary 엔드포인트 추가 |
| 지원서 목록 | `GET /applications` | `GET /applications` (없음 - status/stage별만 존재) | BE에 통합 조회 + 필터 엔드포인트 추가 |
| 지원 요약 | `GET /applications/summary` | **없음** | BE에 summary 엔드포인트 추가 |
| 단계별 집계 | `GET /jobs/:id/applications/stages` | **없음** | BE에 stage 집계 엔드포인트 추가 |
| 입사 처리 | `POST /applications/:id/hire` body: `{departmentId, hireDate}` | `POST /applications/:id/hire` (body 없음) | BE hire()에 departmentId, hireDate 파라미터 추가 |
| 면접 목록 | `GET /interviews` (필터 지원) | 상태별/날짜별 개별 엔드포인트만 | BE에 통합 조회 + 필터 엔드포인트 추가 |
| 내 면접 | `GET /interviews/my` | **없음** | BE에 현재 사용자 면접 조회 추가 |
| 면접 요약 | `GET /interviews/summary` | **없음** | BE에 summary 엔드포인트 추가 |
| 면접 상태변경 | `PATCH /interviews/:id/status` | 개별 POST 엔드포인트 | FE에서 개별 POST 사용하도록 변경 |
| 면접 확인 | `POST /interviews/:id/confirm` | **없음** | BE에 confirm 엔드포인트 추가 또는 FE 제거 |
| 내 평가 | `GET /interviews/:id/scores/my` | **없음** | BE에 현재 사용자 평가 조회 추가 |
| 오퍼 목록 | `GET /offers` (필터 지원) | 상태별 개별 엔드포인트만 | BE에 통합 조회 엔드포인트 추가 |
| 오퍼 요약 | `GET /offers/summary` | **없음** | BE에 summary 엔드포인트 추가 |
| 오퍼 수락/거절 | `POST /offers/:id/respond` body: `{accepted, reason?}` | 개별: `POST /public/:id/accept`, `POST /public/:id/decline` | FE를 개별 엔드포인트로 분리하거나, BE에 respond 통합 API 추가 |
| 오퍼 철회 | `POST /offers/:id/withdraw` | `POST /offers/:id/cancel` | 용어 통일: withdraw vs cancel |

---

## 4. 비즈니스 로직 사양

### 4.1 채용공고 상태 머신

```
DRAFT ──publish()──→ PUBLISHED ──close()──→ CLOSED ──complete()──→ COMPLETED
  │                     │                     │
  └─────cancel()────────┴─────cancel()────────┘→ CANCELLED

PUBLISHED 상태에서만 지원 접수 가능 (isOpen = true && closeDate >= today)
스케줄러: closeDate < today인 PUBLISHED 공고 → 자동 CLOSED
```

### 4.2 지원서 상태 머신

```
SUBMITTED
  ├─ screen(pass=true) → SCREENED → startInterview() → INTERVIEWING
  ├─ screen(pass=false) → SCREENING_REJECTED
  ├─ reject() → REJECTED
  └─ withdraw() → WITHDRAWN

INTERVIEWING
  ├─ passInterview() → INTERVIEW_PASSED → makeOffer() → OFFER_PENDING
  ├─ failInterview() → INTERVIEW_REJECTED
  ├─ reject() → REJECTED
  └─ withdraw() → WITHDRAWN

OFFER_PENDING → hire() → HIRED (이벤트 발행 → Employee 자동생성)
              → reject() → REJECTED
              → withdraw() → WITHDRAWN
```

### 4.3 오퍼 상태 머신

```
DRAFT → submitForApproval() → PENDING_APPROVAL
  → (Approval Service 승인) → APPROVED → send() → SENT
  → (Approval Service 반려) → DRAFT (사유 기록)

SENT → accept() → ACCEPTED
     → decline(reason) → DECLINED
     → negotiate(notes) → NEGOTIATING → (재협상 후) SENT
     → (만료 체크) → EXPIRED

PENDING_APPROVAL / APPROVED / SENT → cancel() → CANCELLED
```

### 4.4 면접 상태 머신

```
SCHEDULING → schedule(date, time) → SCHEDULED
  → start() → IN_PROGRESS → complete(result, score) → COMPLETED
  → cancel() → CANCELLED
  → postpone() → POSTPONED → schedule() → SCHEDULED
  → markNoShow() → NO_SHOW
```

### 4.5 지원번호/오퍼번호 채번 규칙

- **지원번호**: `APP-{YYYYMMDD}-{4자리 시퀀스}` (예: APP-20240115-0001)
  - 현재 구현: 타임스탬프 기반 — 동시성 충돌 가능
  - 개선 필요: DB 시퀀스 기반으로 변경 권장
- **오퍼번호**: `OFR-{YYYYMMDD}-{4자리 시퀀스}` (예: OFR-20240301-0001)
  - 동일 이슈 → DB 시퀀스 기반으로 변경

---

## 5. 설정값 목록

### 5.1 application.yml 현재 설정

| 설정 | 값 | 비고 |
|------|-----|------|
| `server.port` | 8093 | CLAUDE.md 포트표에 미등록 — 등록 필요 |
| `spring.jpa.hibernate.ddl-auto` | **update** | ⚠️ Flyway 사용 중 — **validate로 변경 필수** |
| `spring.jpa.properties.hibernate.default_schema` | hr_recruitment | |
| `spring.flyway.schemas` | hr_recruitment | |
| `spring.cache.redis.time-to-live` | 3600000 (1시간) | |
| `spring.data.redis.port` | 6381 (기본) | 다른 서비스와 포트 확인 필요 |
| `jwt.access-token-expiry` | 1800 (30분) | |
| `jwt.refresh-token-expiry` | 604800 (7일) | |
| `management.endpoints.web.exposure.include` | health,info,metrics,prometheus | |

### 5.2 필요한 설정 변경/추가

| 설정 | 변경 | 사유 |
|------|------|------|
| `ddl-auto` | update → **validate** | Flyway와 충돌, 프로덕션 DDL 자동변경 위험 |
| 개인정보 파기 cron | 추가: `recruitment.privacy.purge-cron=0 0 2 * * ?` | 매일 02:00 |
| 개인정보 보존 기간 | 추가: `recruitment.privacy.retention-days=365` | 1년 |
| 오퍼 만료 기본일 | 추가: `recruitment.offer.default-expiry-days=14` | 기본 14일 |
| 면접 리마인더 | 추가: `recruitment.interview.reminder-hours-before=24` | 24시간 전 |
| 피드백 마감 기본일 | 추가: `recruitment.interview.feedback-deadline-days=3` | 면접 후 3일 |
| 블랙리스트 기본 기간 | 추가: `recruitment.blacklist.default-duration-years=3` | 기본 3년 |

---

## 6. 갭 구현 사양

### 6.1 REC-G01: 공고별 채용 단계 커스텀

**변경 대상**: JobPostingController, ApplicationServiceImpl, FE 컴포넌트

1. JobPosting 생성 시 `interviewProcess` 필수값으로 변경 (기본 템플릿 제공)
2. `moveToNextStage()` 검증 로직 추가:
   ```java
   // interviewProcess에서 현재 stageOrder 다음 단계 조회
   List<Map<String, Object>> process = application.getJobPosting().getInterviewProcess();
   Map<String, Object> nextStep = process.stream()
       .filter(p -> (int) p.get("order") > currentOrder)
       .findFirst()
       .orElseThrow(() -> new BusinessException(ErrorCode.NO_NEXT_STAGE));
   ```
3. FE `StageProgressBar`: interviewProcess 데이터 기반 동적 렌더링
4. FE `ApplicationDetailPage`: 단계 이동 시 공고의 정의된 단계만 선택 가능

### 6.2 REC-G02: 면접유형별 평가항목

**변경 대상**: InterviewServiceImpl, InterviewScoreController, FE InterviewScoreForm

1. `InterviewTypeCriteria` 설정 클래스 추가:
   ```java
   @ConfigurationProperties(prefix = "recruitment.interview.criteria")
   public class InterviewTypeCriteria {
       private Map<InterviewType, List<CriterionConfig>> types;
   }
   ```
2. Interview 생성 시 유형에 맞는 평가항목 자동 세팅
3. InterviewScore 저장 시 criterion이 해당 유형의 정의된 항목인지 검증
4. `maxScore` 기본값 5 → 10으로 변경
5. FE InterviewScoreForm: 면접 유형에 따라 동적 평가항목 렌더링

### 6.3 REC-G03: 입사 전환 이벤트

**변경 대상**: ApplicationServiceImpl.hire(), 이벤트 정의, Employee Service 리스너

1. `RecruitmentHiredEvent` 도메인 이벤트 클래스 생성
2. hire() 메서드에 이벤트 발행 추가 (SNS 토픽: `hr-saas.recruitment.hired`)
3. Employee Service에 이벤트 리스너 추가 → 직원 레코드 + 발령 자동 생성
4. hire() 파라미터 확장: departmentId, hireDate 추가 (FE 요구사항 반영)

### 6.4 REC-G04: 개인정보 자동 파기

**변경 대상**: 신규 스케줄러, ApplicantRepository

1. `PrivacyPurgeScheduler` 신규 생성
2. 매일 02:00 대상자 조회:
   ```sql
   SELECT a.* FROM applicants a
   JOIN applications app ON a.id = app.applicant_id
   WHERE app.status IN ('REJECTED', 'SCREENING_REJECTED', 'INTERVIEW_REJECTED', 'WITHDRAWN')
   AND app.updated_at < NOW() - INTERVAL '365 days'
   AND a.name != '***'  -- 이미 익명화된 건 제외
   ```
3. 익명화 처리 후 File Service에 이력서 삭제 요청 이벤트 발행
4. 파기 이력 감사 로그 기록

### 6.5 REC-G05: Approval 연동

**변경 대상**: OfferServiceImpl, 신규 Feign Client

1. `ApprovalServiceClient` Feign 인터페이스 생성
2. submitForApproval() 수정:
   ```java
   // 1. Offer 상태 변경
   offer.submitForApproval();
   // 2. Approval 결재 요청 생성
   approvalServiceClient.createApprovalRequest(
       ApprovalRequest.builder()
           .templateCode("RECRUITMENT_OFFER")
           .title("[채용] " + offer.getPositionTitle() + " 오퍼 승인")
           .referenceId(offer.getId())
           .referenceType("OFFER")
           .amount(offer.getBaseSalary())
           .build()
   );
   ```
3. Approval 결과 이벤트 리스너 추가 (승인/반려 처리)

### 6.6 REC-G06: 그룹 공유 블랙리스트

**변경 대상**: DB 마이그레이션, 신규 테이블, BlacklistService, TenantServiceClient

1. `V2__blacklist_entries.sql` 마이그레이션 추가
2. `BlacklistService` 신규 생성 (기존 Applicant.blacklisted 필드는 deprecated)
3. 지원 시 `BlacklistService.isBlacklisted(groupId, email)` 호출로 그룹 내 전체 조회
4. Tenant Service Feign Client: 테넌트의 그룹 ID 조회

### 6.7 REC-G08/G09: 면접·피드백 리마인더

**변경 대상**: RecruitmentScheduler, Notification Service 연동

1. Notification Service Feign Client 또는 SNS 이벤트로 알림 발송
2. 면접 리마인더 (08:00): 오늘 예정된 면접 → 면접관 + 지원자에게 알림
3. 피드백 리마인더 (09:00): feedbackDeadline = today인 미완료 평가 → 면접관에게 독촉

### 6.8 REC-G11: FE-BE Enum 통일

**변경 대상**: FE shared-types, FE 컴포넌트

- BE 기준으로 FE enum 통일 (BE가 더 세분화된 상태 관리)
- FE UI에서는 사용자 편의를 위해 그룹핑 표시:
  - "심사중" = SCREENING + SCREENED
  - "면접중" = INTERVIEWING + INTERVIEW_PASSED
  - "불합격" = SCREENING_REJECTED + INTERVIEW_REJECTED + REJECTED

### 6.9 REC-G12: FE-BE 엔드포인트 통일

**변경 대상**: BE 컨트롤러 (누락 엔드포인트 추가)

BE에 추가 필요한 엔드포인트:
1. `GET /api/v1/jobs/summary` — 공고 상태별 집계
2. `GET /api/v1/applications` — 통합 목록 (keyword, status, stage, jobId 필터)
3. `GET /api/v1/applications/summary` — 지원 상태별 집계
4. `GET /api/v1/jobs/{id}/applications/stages` — 공고별 단계 분포
5. `GET /api/v1/interviews` — 통합 목록 (type, status, date 필터)
6. `GET /api/v1/interviews/my` — 내 면접 목록
7. `GET /api/v1/interviews/summary` — 면접 상태별 집계
8. `GET /api/v1/interviews/{id}/scores/my` — 내 평가 조회
9. `GET /api/v1/offers` — 통합 목록 (status 필터)
10. `GET /api/v1/offers/summary` — 오퍼 상태별 집계

---

## 7. 테스트 시나리오

### 7.1 채용공고

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| 1 | DRAFT 공고 publish | 상태 PUBLISHED, openDate 설정 |
| 2 | closeDate 경과 공고 | 스케줄러가 CLOSED 처리 |
| 3 | CLOSED 공고에 지원 | 예외: 마감된 공고 |
| 4 | 중복 jobCode 생성 | 예외: 코드 중복 |
| 5 | CANCELLED 공고에 publish | 예외: 취소된 공고 상태 전이 불가 |

### 7.2 지원/심사

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| 1 | 동일 공고 중복 지원 | 예외: 이미 지원됨 |
| 2 | 블랙리스트 지원자 지원 | 예외: 블랙리스트 차단 (그룹 범위 확인) |
| 3 | 서류 합격 처리 | 상태 SCREENED, currentStage = INTERVIEW |
| 4 | 서류 불합격 처리 | 상태 SCREENING_REJECTED |
| 5 | 이미 심사된 지원서 재심사 | 예외: 이미 처리됨 |
| 6 | 지원 시 applicationCount 증가 | JobPosting.applicationCount += 1 |

### 7.3 면접

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| 1 | 면접 일정 설정 | 상태 SCHEDULED, 날짜/시간 설정 |
| 2 | 면접 완료 (PASS) | 상태 COMPLETED, result=PASS, 점수 기록 |
| 3 | 면접 노쇼 | 상태 NO_SHOW |
| 4 | 연기 후 재일정 | POSTPONED → schedule() → SCHEDULED |
| 5 | 유형별 평가항목 검증 | TECHNICAL 면접에 PERSONALITY 항목 제출 시 거절 |
| 6 | 가중치 기반 평균 점수 | SUM(score*weight)/SUM(weight) 정확성 |

### 7.4 오퍼

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| 1 | 오퍼 결재 요청 | Approval Service에 결재 생성 + 상태 PENDING_APPROVAL |
| 2 | 결재 승인 이벤트 수신 | 상태 APPROVED |
| 3 | 결재 반려 이벤트 수신 | 상태 DRAFT + 반려 사유 저장 |
| 4 | 오퍼 수락 | 상태 ACCEPTED |
| 5 | 오퍼 만료 | SENT + expiresAt < now → 스케줄러가 EXPIRED 처리 |
| 6 | 동일 지원에 중복 오퍼 | 예외: 이미 오퍼 존재 |
| 7 | 협상 진행 | SENT → NEGOTIATING → 재발송 → SENT |

### 7.5 입사 전환

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| 1 | hire() 실행 | Application=HIRED, 이벤트 발행 |
| 2 | 이벤트 수신 (Employee Service) | PRE_ONBOARDING 직원 생성 + 입사 발령 |
| 3 | 이벤트 처리 실패 | DLQ 이동 + HR 알림 |

### 7.6 개인정보 파기

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| 1 | 불합격 1년 경과 | 개인정보 익명화, 이력서 삭제 |
| 2 | 채용된 지원자 | 파기 대상 제외 |
| 3 | 익명화 후 통계 조회 | 건수 통계는 유지됨 |

---

## 8. 의존성 (다른 모듈 연동)

| 연동 모듈 | 연동 방식 | 내용 |
|-----------|----------|------|
| Employee Service | 이벤트 (SNS/SQS) | hire 시 직원 자동 생성 이벤트 발행 |
| Approval Service | Feign Client + 이벤트 | 오퍼 결재 요청/결과 수신 |
| Tenant Service | Feign Client | 그룹 ID 조회 (블랙리스트 공유용) |
| Notification Service | 이벤트 (SNS/SQS) | 면접 리마인더, 피드백 독촉, 오퍼 알림 |
| File Service | Feign Client + 이벤트 | 이력서 다운로드, 개인정보 파기 시 파일 삭제 |
| Organization Service | Feign Client (향후) | 부서 정보 조회, 정현원 연동 |
| MDM Service | Feign Client (향후) | 면접 평가항목, 직급 코드 등 마스터 데이터 |

---

## 9. 프론트엔드 컴포넌트 현황

### 9.1 페이지 목록

| 페이지 | 파일 | 주요 기능 |
|--------|------|----------|
| 채용공고 목록 | JobPostingListPage.tsx | 요약 카드, 상태 탭 필터, 검색, 페이지네이션 |
| 채용공고 생성/수정 | JobPostingCreatePage.tsx | JobPostingForm 폼, 급여 범위 검증, 날짜 검증 |
| 채용공고 상세 | JobPostingDetailPage.tsx | 상세 정보, 지원자 파이프라인 시각화, 상태 전이 액션 |
| 지원서 목록 | ApplicationListPage.tsx | 공고별 필터, 상태 필터, 검색 |
| 지원서 상세 | ApplicationDetailPage.tsx | 단계 진행 바, 심사/면접/거절/입사 액션, 면접 카드 |
| 면접 일정 | InterviewListPage.tsx | 상태별 탭, 요약 카드 |
| 내 면접 | MyInterviewsPage.tsx | 오늘 면접, 평가 대기, 점수 제출 폼 |

### 9.2 공통 컴포넌트

| 컴포넌트 | 용도 |
|----------|------|
| StageProgressBar | 지원 단계 진행률 시각화 (5단계 → 동적 변경 필요) |
| StageCountBar | 공고별 단계 분포 가로 바 차트 |
| JobPostingForm | 공고 생성/수정 폼 (급여, 기간 검증) |
| InterviewScheduleForm | 면접 일정 등록 폼 |
| InterviewScoreForm | 면접 평가 폼 (점수 5개 + 추천 + 코멘트) |

### 9.3 FE 개선 필요사항

| 항목 | 현재 | 개선 |
|------|------|------|
| 채용 단계 | 5단계 하드코딩 | 공고 interviewProcess 기반 동적 렌더링 |
| 평가 항목 | 5개 고정 | 면접 유형별 동적 항목 |
| 상태 enum | FE 독자 정의 | BE enum 기준 통일 |
| 오퍼 관리 페이지 | 미구현 (mock만 존재) | OfferListPage, OfferDetailPage 신규 개발 |
| 통계 대시보드 | 미구현 | RecruitmentDashboardPage 신규 개발 |
| 부서 선택 | 하드코딩 6개 | Organization Service 연동 동적 조회 |
