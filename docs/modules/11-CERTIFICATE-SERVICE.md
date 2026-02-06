# Module 11: Certificate Service (증명서관리)

> 분석일: 2026-02-06
> 포트: 8092
> 패키지: `com.hrsaas.certificate`
> DB 스키마: `hr_certificate`

---

## 1. 현재 구현 상태 요약

### 1.1 완료된 기능

| 기능 | 상태 | 설명 |
|------|------|------|
| 증명서 유형 CRUD | ✅ 완료 | CertificateType 생성/수정/삭제, 활성화/비활성화, 코드 유니크 |
| 증명서 템플릿 CRUD | ✅ 완료 | CertificateTemplate — HTML 기반 템플릿, 변수/CSS/헤더/푸터, A4/Portrait 기본 |
| 증명서 신청 | ✅ 완료 | CertificateRequest — 직원 셀프서비스 신청, 신청번호 자동채번, 부수/언어/목적 설정 |
| 승인/반려 | ✅ 완료 | PENDING→APPROVED/REJECTED 상태변경 (자체 처리, Approval 미연동) |
| 증명서 발급 | ✅ 완료 | CertificateIssue — 발급번호/검증코드 자동생성, 콘텐츠 스냅샷(JSONB), 유효기간 설정 |
| 진위확인 (공개) | ✅ 완료 | 비인증 공개 API — 검증코드로 진위확인, IP 기반 Rate Limiting (시간당 10회) |
| 검증 로그 | ✅ 완료 | VerificationLog — 검증 시도 이력 기록 (IP, UserAgent, 조직명), 성공/실패 통계 |
| 증명서 폐기 | ✅ 완료 | revoke() — 폐기 사유, 폐기자, 폐기일 기록 |
| 통계 | ✅ 완료 | CertificateStatistics — 신청/발급/검증 집계, 월별 추이, 유형별 분포 |
| 템플릿 미리보기 | ✅ 완료 | HTML 미리보기 반환 (TEXT_HTML) |
| 개인정보 마스킹 | ✅ 완료 | CertificateRequestResponse, CertificateIssueResponse에 @Masked 적용 |
| RLS | ✅ 완료 | 모든 테넌트 테이블 RLS 적용 (verification_logs 제외 — 공개 테이블) |
| Redis 캐시 | ✅ 완료 | 유형/템플릿 캐시, 변경 시 evict |
| 다운로드 카운터 | ✅ 완료 | 다운로드 시 downloadCount 증가 + downloadedAt 기록 |
| 콘텐츠 스냅샷 | ✅ 완료 | 발급 시점의 데이터를 JSONB로 보존 (발급 후 원본 변경되어도 발급 내용 유지) |

### 1.2 미구현 / 갭

| 갭 ID | 기능 | 우선순위 | 설명 |
|--------|------|----------|------|
| CERT-G01 | PDF 생성 | HIGH | downloadPdf() TODO 스텁 (빈 byte[] 반환) → **정책결정: Flying Saucer 직접 생성** (§2.1) |
| CERT-G02 | Approval Service 연동 | HIGH | requiresApproval=true일 때 결재 플로우 미구현 → **정책결정: Approval 연동** (§2.2) |
| CERT-G03 | Employee Service 연동 | HIGH | employeeId로 직원 정보 조회 없음 (이름/사번 직접 입력) |
| CERT-G04 | Tenant 정보 조회 | MEDIUM | 진위확인 시 회사명 하드코딩("회사명") → Tenant Service 연동 필요 |
| CERT-G05 | 만료 알림 | MEDIUM | 증명서 만료 임박 시 알림 없음 |
| CERT-G06 | 발급 이력 리포트 | LOW | 관리자용 발급 통계 리포트 (엑셀 다운로드 등) 미구현 |
| CERT-G07 | FE-BE DTO 불일치 | HIGH | FE request DTO 키 차이 (§3.1) |
| CERT-G08 | ddl-auto 미확인 | MEDIUM | application.yml의 ddl-auto 설정 확인 필요 |
| CERT-G09 | 발급 수량 제한 | MEDIUM | 기간별 발급 수량 제한 로직 없음 (maxCopiesPerRequest만 존재) |
| CERT-G10 | 관리자 페이지 | HIGH | FE에 관리자 페이지 없음 (유형/템플릿 관리, 승인/반려, 발급 이력) |

---

## 2. 정책 결정사항

### 2.1 PDF 생성 방식 ✅ 결정완료

> **결정: Certificate Service 내에서 Flying Saucer로 직접 생성**

- 기술 스택: **Flying Saucer (OpenHTMLtoPDF)** — 이미 의존성 존재
- 생성 프로세스:
  1. CertificateIssue.contentSnapshot (JSONB)에서 데이터 추출
  2. CertificateTemplate의 contentHtml에 변수 바인딩 (Thymeleaf 또는 문자열 치환)
  3. headerHtml + contentHtml + footerHtml + cssStyles 조합
  4. Flying Saucer로 HTML → PDF 변환
  5. 직인/서명 이미지 삽입 (includeCompanySeal, includeSignature)
  6. 생성된 PDF를 File Service에 저장 → fileId 기록
- 페이지 설정: pageSize (A4 기본), orientation (PORTRAIT 기본), margins (상하좌우 각 20mm)
- 폰트: 한글 폰트 번들 포함 (NanumGothic 또는 Noto Sans KR)
- 캐시: 생성된 PDF fileId 저장 → 재다운로드 시 File Service에서 직접 반환
- 성능: 대량 발급 시 비동기 처리 (@Async) 고려

### 2.2 Approval Service 연동 ✅ 결정완료

> **결정: requiresApproval=true인 증명서 유형은 Approval Service 연동**

- 연동 대상: CertificateType.requiresApproval = true인 유형
  - 예: 경력증명서, 급여명세서, 퇴직증명서, 소득금액증명
- 연동 흐름:
  1. 신청 생성 시 requiresApproval 확인
  2. true → Approval Service에 결재 요청 생성 (Feign Client)
  3. 결재 완료 이벤트 수신 → CertificateRequest.approve() 실행
  4. autoIssue=true이면 자동 발급, false이면 HR 담당자가 수동 발급
  5. 결재 반려 이벤트 수신 → CertificateRequest.reject() 실행
- 결재 양식:
  ```
  제목: [증명서] {typeName} 발급 신청 - {employeeName}
  본문: 증명서 유형, 부수, 용도, 제출처, 급여포함 여부
  ```
- autoIssue=true & requiresApproval=false: 신청 즉시 자동 발급 (재직증명서 등)
- CertificateType.approvalTemplateId 활용: 결재 템플릿 지정 가능

### 2.3 만료 후 정책 ✅ 결정완료

> **결정: 만료 시 새로 신청**

- 만료된 증명서는 재발급 불가 → 동일 유형으로 새로 신청
- FE: 만료 상태 표시, 다운로드 버튼 비활성화, "새로 신청" 링크 제공
- 만료 임박 알림: expiresAt 7일 전 Notification Service를 통해 알림 발송 (향후 구현)

---

## 3. FE-BE 불일치 분석

### 3.1 DTO/필드명 불일치

| 구분 | FE (service/types) | BE (DTO/Entity) | 조치 |
|------|-------------------|-----------------|------|
| 신청 DTO | `certificateTypeCode` (string) | `certificateTypeId` (UUID) | **통일 필요** — FE는 code 기반, BE는 ID 기반. code 기반이 사용자 친화적이므로 BE에 code 기반 조회 추가 또는 FE에서 code→ID 변환 |
| 유형 상태 | `status: 'ACTIVE' \| 'INACTIVE'` | `active: boolean` | FE → boolean 방식으로 변환 |
| 발급 응답 | `fileName, fileSize` 필드 존재 | BE 응답에 없음 | BE 응답에 File Service 연동하여 추가 또는 FE 제거 |
| 검증 결과 | `isValid, isRevoked, isExpired` | BE: `valid, expired, revoked` | 네이밍 통일 (is 접두사 제거) |
| 다운로드 URL | `GET /issues/{issueNumber}/download` | `GET /issues/{id}/download` (UUID) | **경로 키 불일치** — issueNumber vs UUID id |

### 3.2 누락 기능

| FE 존재 | BE 존재 | 조치 |
|---------|---------|------|
| 증명서 신청 페이지 ✅ | 신청 API ✅ | OK |
| 내 신청 목록 ✅ | getMyRequests ✅ | OK |
| 발급 이력 ✅ | 발급 조회 ✅ | OK |
| 진위확인 ✅ | verify API ✅ | OK |
| 관리자 유형 관리 ❌ | CertificateTypeController ✅ | **FE 관리자 페이지 개발 필요** |
| 관리자 템플릿 관리 ❌ | CertificateTemplateController ✅ | **FE 관리자 페이지 개발 필요** |
| 관리자 승인/반려 ❌ | approve/reject API ✅ | **FE 관리자 승인 페이지 개발 필요** |
| 관리자 발급 처리 ❌ | issue API ✅ | **FE 관리자 발급 페이지 개발 필요** |
| 관리자 통계 ❌ | CertificateStatisticsController ✅ | **FE 통계 대시보드 개발 필요** |

---

## 4. 비즈니스 로직 사양

### 4.1 증명서 신청-발급 워크플로우

```
[직원] 신청 (CertificateRequest 생성)
  │
  ├─ requiresApproval=false & autoIssue=true (예: 재직증명서)
  │   └→ 즉시 ISSUED → PDF 생성 → 다운로드 가능
  │
  ├─ requiresApproval=false & autoIssue=false
  │   └→ PENDING → HR 관리자가 수동 발급 → ISSUED
  │
  └─ requiresApproval=true (예: 경력증명서, 급여명세서)
      └→ PENDING → Approval Service 결재 요청
          ├→ 결재 승인 → APPROVED
          │   ├─ autoIssue=true → 자동 ISSUED
          │   └─ autoIssue=false → HR 관리자가 수동 발급 → ISSUED
          └→ 결재 반려 → REJECTED (반려 사유 기록)
```

### 4.2 진위확인 플로우

```
[외부 사용자] 검증코드 입력 (공개 API, 인증 불필요)
  │
  ├─ Rate Limit 체크 (IP당 시간당 10회)
  │   └→ 초과 시 거부
  │
  ├─ 검증코드 조회
  │   └→ 미발견 → 유효하지 않은 증명서 (VerificationLog 기록)
  │
  ├─ 폐기 여부 확인
  │   └→ 폐기됨 → 폐기된 증명서 (VerificationLog 기록)
  │
  ├─ 만료 여부 확인
  │   └→ 만료됨 → 만료된 증명서 (VerificationLog 기록)
  │
  └─ 유효 → 증명서 정보 반환 + verifiedCount 증가 (VerificationLog 기록)
```

### 4.3 검증코드 형식

- 형식: `XXXX-XXXX-XXXX` (12자 영숫자, 4자리 단위 하이픈 구분)
- 생성: SecureRandom으로 안전한 랜덤 생성
- 유니크: DB 레벨 UNIQUE 제약

### 4.4 채번 규칙

- **신청번호**: `REQ-{YYYYMMDD}-{시퀀스}` — 현재 AtomicLong 기반 (서비스 재시작 시 리셋 위험)
- **발급번호**: `CERT-{YYYYMMDD}-{시퀀스}` — 동일 이슈
- **개선 필요**: DB 시퀀스 기반으로 변경 권장 (동시성 안전, 재시작 안전)

---

## 5. 설정값 목록

### 5.1 application.yml 현재 설정

| 설정 | 값 | 비고 |
|------|-----|------|
| `server.port` | 8092 | CLAUDE.md 포트표에 미등록 — 등록 필요 |
| `spring.jpa.properties.hibernate.default_schema` | hr_certificate | |
| `spring.flyway.schemas` | hr_certificate | |
| `spring.cache.redis.time-to-live` | 3600000 (1시간) | |
| `spring.thymeleaf.cache` | false | 개발 환경 — 프로덕션에서 true로 변경 |

### 5.2 필요한 설정 추가

| 설정 | 값 | 사유 |
|------|-----|------|
| `certificate.pdf.font-path` | classpath:fonts/NanumGothic.ttf | 한글 PDF 폰트 경로 |
| `certificate.pdf.temp-dir` | /tmp/certificates | PDF 임시 생성 경로 |
| `certificate.verification.rate-limit` | 10 | 시간당 IP별 최대 검증 횟수 (현재 하드코딩) |
| `certificate.verification.rate-limit-window` | 3600 | Rate limit 윈도우 (초) |
| `certificate.expiry.notification-days-before` | 7 | 만료 전 알림 일수 |
| `certificate.issue.max-per-month` | 50 | 직원 1인당 월 최대 발급 건수 |

---

## 6. 갭 구현 사양

### 6.1 CERT-G01: PDF 생성 구현

**변경 대상**: CertificateIssueServiceImpl.downloadPdf(), 신규 PdfGeneratorService

1. `PdfGeneratorService` 클래스 신규 생성:
   ```java
   @Service
   public class PdfGeneratorService {
       public byte[] generatePdf(CertificateTemplate template,
                                  Map<String, Object> variables,
                                  boolean includeSeal,
                                  boolean includeSignature) {
           // 1. Thymeleaf로 변수 바인딩
           String html = bindVariables(template.getContentHtml(), variables);
           // 2. 헤더/푸터/CSS 조합
           String fullHtml = buildFullHtml(template, html);
           // 3. Flying Saucer로 HTML→PDF 변환
           ITextRenderer renderer = new ITextRenderer();
           renderer.setDocumentFromString(fullHtml);
           renderer.layout();
           ByteArrayOutputStream os = new ByteArrayOutputStream();
           renderer.createPDF(os);
           return os.toByteArray();
       }
   }
   ```
2. 한글 폰트 등록: `renderer.getFontResolver().addFont("fonts/NanumGothic.ttf", ...)`
3. 발급 시 PDF 생성 → File Service 업로드 → fileId 저장
4. 재다운로드 시: fileId로 File Service에서 직접 조회

### 6.2 CERT-G02: Approval Service 연동

**변경 대상**: CertificateRequestServiceImpl.create(), 신규 이벤트 리스너

1. create() 수정: requiresApproval=true → Approval Service에 결재 요청
2. 결재 완료 이벤트 리스너:
   ```java
   @EventListener
   public void handleApprovalCompleted(ApprovalCompletedEvent event) {
       if ("CERTIFICATE_REQUEST".equals(event.getReferenceType())) {
           if (event.isApproved()) {
               approve(event.getReferenceId(), ...);
               if (certificateType.isAutoIssue()) {
                   issue(requestId, ...);
               }
           } else {
               reject(event.getReferenceId(), event.getReason());
           }
       }
   }
   ```

### 6.3 CERT-G03: Employee Service 연동

**변경 대상**: CertificateRequestServiceImpl.create()

1. `EmployeeServiceClient` Feign 인터페이스 생성
2. 신청 시 employeeId로 Employee Service 조회 → employeeName, employeeNumber 자동 설정
3. PDF 변수 바인딩에 직원 정보 (부서, 직급, 입사일 등) 포함

### 6.4 CERT-G04: Tenant 정보 조회

**변경 대상**: CertificateVerificationServiceImpl.verify()

1. `TenantServiceClient` Feign 인터페이스 활용
2. 검증 시 tenantId → Tenant Service 조회 → 회사명 반환
3. 하드코딩 "회사명" 제거

### 6.5 CERT-G10: 관리자 페이지 (FE)

**신규 개발 필요**:
1. **CertificateTypeManagementPage**: 증명서 유형 CRUD, 활성화/비활성화
2. **CertificateTemplateManagementPage**: 템플릿 CRUD, HTML 편집기, 미리보기
3. **CertificateApprovalPage**: 대기 중 신청 목록, 승인/반려 처리
4. **CertificateIssuePage**: 승인된 신청 발급 처리 (autoIssue=false 유형)
5. **CertificateStatisticsPage**: 발급 통계 대시보드, 월별 추이, 유형별 분포

---

## 7. 테스트 시나리오

### 7.1 증명서 유형/템플릿

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| 1 | 중복 code 유형 생성 | 예외: 코드 중복 |
| 2 | 비활성 유형으로 신청 | 예외: 비활성 유형 |
| 3 | 템플릿 미리보기 | HTML 반환 (헤더+본문+푸터+CSS 포함) |

### 7.2 신청-발급

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| 1 | 재직증명서 신청 (autoIssue=true, requiresApproval=false) | 즉시 ISSUED + PDF 생성 |
| 2 | 경력증명서 신청 (requiresApproval=true) | PENDING → Approval 결재 요청 생성 |
| 3 | 결재 승인 이벤트 (autoIssue=false) | APPROVED 상태, 수동 발급 대기 |
| 4 | 결재 승인 이벤트 (autoIssue=true) | APPROVED → 자동 ISSUED + PDF 생성 |
| 5 | 결재 반려 이벤트 | REJECTED + 반려 사유 저장 |
| 6 | maxCopiesPerRequest 초과 | 예외: 최대 부수 초과 |
| 7 | PENDING 상태 취소 | CANCELLED |
| 8 | ISSUED 상태 취소 시도 | 예외: 이미 발급됨 |

### 7.3 PDF 생성

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| 1 | 한글 재직증명서 PDF | 한글 폰트 포함, A4 세로, 직인 포함 |
| 2 | 영문 재직증명서 PDF | 영문 템플릿 적용, A4 세로 |
| 3 | 급여포함 증명서 | contentSnapshot에 급여 정보 포함 |
| 4 | 폐기된 증명서 다운로드 | 예외: 폐기된 증명서 |

### 7.4 진위확인

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| 1 | 유효한 검증코드 | valid=true, 증명서 정보 반환, verifiedCount++ |
| 2 | 존재하지 않는 검증코드 | valid=false, "유효하지 않은 증명서" |
| 3 | 만료된 증명서 | valid=false, "만료된 증명서" |
| 4 | 폐기된 증명서 | valid=false, "폐기된 증명서" |
| 5 | IP Rate Limit 초과 (11회) | 거부 응답 |
| 6 | VerificationLog 기록 확인 | IP, UserAgent, 결과, 시각 기록 |

---

## 8. 의존성 (다른 모듈 연동)

| 연동 모듈 | 연동 방식 | 내용 |
|-----------|----------|------|
| Approval Service | Feign Client + 이벤트 | requiresApproval=true 유형 결재 요청/결과 수신 |
| Employee Service | Feign Client | 직원 정보 조회 (이름, 사번, 부서, 직급, 입사일) |
| Tenant Service | Feign Client | 회사 정보 조회 (진위확인 시 회사명) |
| File Service | Feign Client | PDF 파일 저장/조회/다운로드 |
| Notification Service | 이벤트 (SNS/SQS) | 발급 완료 알림, 만료 임박 알림 |

---

## 9. 엔티티 구조 요약

### 9.1 주요 엔티티

| 엔티티 | 설명 | 테넌트 | 주요 관계 |
|--------|------|--------|----------|
| CertificateType | 증명서 유형 (재직/경력/급여 등) | ✅ | 1:N → CertificateRequest |
| CertificateTemplate | HTML 템플릿 | ✅ | 1:N ← CertificateType.templateId |
| CertificateRequest | 발급 신청 건 | ✅ | N:1 → CertificateType, 1:N → CertificateIssue |
| CertificateIssue | 발급된 증명서 | ✅ | N:1 → CertificateRequest, 1:N → VerificationLog |
| VerificationLog | 진위확인 이력 | ❌ (공개) | N:1 → CertificateIssue |

### 9.2 상태 머신 (RequestStatus)

```
PENDING ─→ APPROVED ─→ ISSUED
   │          │
   ├→ REJECTED │
   │           │
   └→ CANCELLED │
                └→ (만료 시: 새로 신청)
```

### 9.3 증명서 유형 기본값 (Mock 기준)

| 유형 코드 | 이름 | 승인필요 | 자동발급 | 유효기간 | 수수료 | 최대부수 |
|-----------|------|---------|---------|---------|--------|---------|
| EMPLOYMENT | 재직증명서 | ❌ | ✅ | 90일 | 0원 | 5 |
| CAREER | 경력증명서 | ✅ | ❌ | 90일 | 0원 | 5 |
| SALARY | 급여명세서 | ✅ | ❌ | 30일 | 1,000원 | 3 |
| RETIREMENT | 퇴직증명서 | ✅ | ❌ | 90일 | 0원 | 5 |
| INCOME | 소득금액증명 | ✅ | ❌ | 30일 | 2,000원 | 3 |

### 9.4 지원 언어

| 코드 | 언어 |
|------|------|
| KO | 한국어 |
| EN | 영어 |
| ZH_CN | 중국어(간체) |
| ZH_TW | 중국어(번체) |
| JA | 일본어 |
