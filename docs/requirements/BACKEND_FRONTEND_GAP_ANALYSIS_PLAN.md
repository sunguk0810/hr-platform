# Backend/Frontend 요구사항 재정리 및 Gap Analysis + 구현 플랜

> **작성일**: 2026-02-12  
> **대상**: PO, PM, BE/FE 리드, 아키텍트, QA  
> **근거 문서**: `docs/status/CURRENT_STATUS.md`, `docs/requirements/TRACEABILITY_MATRIX.md`, `docs/modules/05~12-*-SERVICE.md`

---

## 1. 목적

본 문서는 현재 구현 상태를 기준으로 백엔드(Backend)와 프론트엔드(Frontend)의 **요구사항-구현 간 간극(Gap)** 을 재정리하고,
산출된 Gap을 기반으로 **요구사항 상세화(Definition Refinement)** 및 **단계별 구현 계획(Execution Plan)** 을 수립하기 위한 실행 문서입니다.

---

## 2. 범위 및 분석 기준

### 2.1 범위
- **Backend**: 12개 마이크로서비스 중 Gap이 명시된 핵심 도메인
  - Employee, Attendance, Approval, Appointment, Recruitment, Certificate, File, Notification
- **Frontend**: 운영 화면/연동 관점 Gap
  - 실 API 연동, 관리자 기능 페이지, mock-only 기능의 실구현 전환

### 2.2 분류 기준
- **정합성 Gap**: FE↔BE API 스펙/응답/페이지네이션 불일치
- **기능 Gap**: PRD/Traceability 기준 미완료 기능
- **연동 Gap**: 서비스 간 Feign/Event 연동 미구현
- **운영 Gap**: 테스트/모니터링/인프라 미완성

### 2.3 우선순위 기준
- **P0 (즉시)**: 핵심 비즈니스 플로우 단절, 다수 화면 영향, 운영 리스크 큼
- **P1 (단기)**: 단일 도메인 중심이나 사용자 체감 큰 기능
- **P2 (중기)**: 확장/고도화 성격, 대체 경로 존재

---

## 3. 현재 상태 요약 (As-Is)

- 백엔드 서비스/프론트엔드 화면 개발률은 문서상 100%에 근접하나,
  **일부 도메인(증명서/발령/채용)에서 스텁(TODO) 및 연동 누락**이 남아 있음.
- FE↔BE 연동 1차 정리는 완료되었으나,
  **mock 기반 운영 기능을 실 API로 전환하는 2차 통합 단계**가 필요함.
- 요구사항 추적 관점에서는 전체 완성도가 높지만,
  **도메인 간 이벤트 기반 자동화(approval 완료 후 후속 처리 등)** 에서 잔여 Gap이 존재함.

---

## 4. Backend Gap Analysis

## 4.1 도메인별 Gap 요약

| 도메인 | 대표 Gap | 우선순위 | 영향 |
|---|---|---|---|
| Appointment | Approval/Employee 연동 스텁, summary API 부재 | P0 | 발령 승인 후 실제 인사 반영 단절 |
| Certificate | PDF/Approval/Employee/File/Notification 연동 미완 | P0 | 증명서 발급 핵심 시나리오 불완전 |
| Recruitment | Feign/Event/Scheduler 일부 TODO | P1 | 채용 자동화/후속 처리 누락 |
| Employee | 변경요청-결재 연동, 사원증/수당 연계 일부 미완 | P1 | 인사 운영 자동화/정책 완성도 저하 |
| Approval | 모듈 반영 후속 처리 일부 미완 | P1 | 결재 완료 이후 도메인 반영 누락 가능 |
| File/Notification | 실제 외부 연동(S3/메일) 미완 | P1 | 운영 환경 기능 제한 |

## 4.2 상세 Gap 목록 (Backend)

| ID | Gap | 현재 상태 | 상세 요구사항(정의 보강) | 우선순위 |
|---|---|---|---|---|
| BE-GAP-01 | 발령 승인 후 직원 정보 자동 반영 | Appointment에서 TODO 스텁 | Approval 완료 이벤트 수신 시 Employee 변경 이벤트 발행/보상 트랜잭션 정의 | P0 |
| BE-GAP-02 | 발령 summary API | FE 호출 엔드포인트 부재 | `GET /appointments/drafts/summary` 계약 고정(기간/조직/상태 필터) | P0 |
| BE-GAP-03 | 증명서 PDF 생성 | `downloadPdf()` 스텁 | 템플릿 렌더링, 워터마크/진위코드 포함, 실패 재시도 정책 | P0 |
| BE-GAP-04 | 증명서 결재 연동 | Feign/이벤트 미구현 | requiresApproval=true 표준 플로우(요청→상신→완료→발급) 명세화 | P0 |
| BE-GAP-05 | 증명서 File/Notification 연동 | 컬럼/의존성만 존재 | PDF 저장(fileId), 발급 완료/만료 임박 알림 이벤트 정의 | P0 |
| BE-GAP-06 | Recruitment 후속 자동화 | 일부 Scheduler TODO | 리마인더 스케줄러 2종 + 입사전환 이벤트 표준 이벤트 스키마 확정 | P1 |
| BE-GAP-07 | Employee 변경요청 결재 연동 | 정책 문서상 미완 | 개인정보 변경요청 승인 시 적용/이력 반영 상태머신 정의 | P1 |
| BE-GAP-08 | Approval 완료 후 모듈 반영 일관성 | 수신측 처리 일부 미완 | 도메인별 `ApprovalCompletedEvent` 소비 계약(멱등키/재처리) 표준화 | P1 |
| BE-GAP-09 | 파일/메일 실연동 | Mock 유지 | S3 업로드/다운로드, SMTP/SES 발송 경로 운영 설정 완료 | P1 |
| BE-GAP-10 | 통합 테스트 공백 | 서비스별 IT 부족 | Testcontainers + 계약 테스트 + 이벤트 E2E 스모크를 CI 필수 게이트로 추가 | P1 |

---

## 5. Frontend Gap Analysis

## 5.1 도메인별 Gap 요약

| 도메인 | 대표 Gap | 우선순위 | 영향 |
|---|---|---|---|
| Appointment | 발령이력/통계 화면 미구현 | P0 | 사용자 관점 핵심 운영 가시성 부족 |
| Certificate | 관리자 페이지(유형/템플릿/승인/통계) 미구현 | P0 | 운영자 업무 전환 불가 |
| 통합 API 연동 | mock-only 기능 잔존 | P1 | 운영 전환 시 기능 동작 불확실 |
| 공통 데이터 계층 | 일부 리스트 PageResponse 래핑 의존 | P2 | API 표준화/재사용성 저하 |

## 5.2 상세 Gap 목록 (Frontend)

| ID | Gap | 현재 상태 | 상세 요구사항(정의 보강) | 우선순위 |
|---|---|---|---|---|
| FE-GAP-01 | 발령 이력 페이지 | BE API 존재, FE 미구현 | 검색/필터/상태뱃지/상세 Drawer/CSV 내보내기 포함 | P0 |
| FE-GAP-02 | 발령 통계 대시보드 | BE API 존재, FE 미구현 | 기간 비교, 조직별 집계, 실패/롤백 건수 위젯 정의 | P0 |
| FE-GAP-03 | 증명서 관리자 화면군 | 미구현 | 유형관리/템플릿관리/승인함/발급이력/통계 5개 화면 분할 구현 | P0 |
| FE-GAP-04 | 실 API 모드 전환 검증 | MSW 중심 | feature flag로 mock/api 전환 + 각 페이지 health badge 표시 | P1 |
| FE-GAP-05 | 결재 후속 상태 동기화 UX | 도메인별 편차 | optimistic update + SSE/폴링 fallback + 재시도 UX 표준안 | P1 |
| FE-GAP-06 | 페이지네이션 래핑 의존 | 일부 list를 FE에서 변환 | API 표준 계약 전환 또는 공통 adapter 유틸로 명시적 분리 | P2 |

---

## 6. Gap 기반 요구사항 상세화 템플릿 (Refinement)

각 Gap은 아래 템플릿으로 상세화하여 Jira Epic/Story로 전환합니다.

- **요구사항 ID**: `REQ-BE-xxx` / `REQ-FE-xxx`
- **배경/문제**: 왜 필요한가 (운영 리스크/사용자 영향)
- **사용자 시나리오**: As-Is / To-Be (Happy + Edge)
- **입출력 계약**: API Request/Response, 이벤트 Payload, 오류 코드
- **권한/보안**: 역할, 마스킹, 감사로그, 테넌트 격리
- **수용 기준(AC)**: Given/When/Then 3개 이상
- **비기능 요구사항**: 성능(SLO), 가용성, 재시도/멱등성
- **테스트 기준**: 단위/통합/E2E/계약 테스트 항목
- **릴리즈 기준**: feature flag, 롤백 전략, 모니터링 지표

---

## 7. 구현 플랜 (To-Be Execution Plan)

## 7.1 3단계 실행 로드맵

### Phase 1 (2~3주): P0 핵심 플로우 완결
- Appointment 연동 스텁 제거 + summary API 추가
- Certificate 발급 코어(PDF + Approval + File 연동) 완성
- FE: 발령 이력/통계, 증명서 관리자 핵심 화면 착수
- 산출물: 운영 가능한 E2E 핵심 시나리오 5종

### Phase 2 (2주): P1 자동화/연동 고도화
- Recruitment 스케줄러/이벤트 후속 자동화 구현
- Employee 변경요청 결재 연동 + Approval 소비 표준화
- File/Notification 실연동(운영 파라미터 포함)
- 산출물: 이벤트 기반 후속 처리 실패율/재처리 대시보드

### Phase 3 (1~2주): P2 표준화/안정화
- FE 페이지네이션/데이터 어댑터 표준화
- 통합 테스트(Testcontainers + 계약 테스트) CI 게이트 적용
- 문서/Traceability 최신화 및 릴리즈 체크리스트 확정
- 산출물: QA sign-off + 운영 전환 readiness 리뷰

## 7.2 제안 일정 (예시)

| 주차 | 목표 | 완료 기준 |
|---|---|---|
| W1 | P0 상세 설계/계약 고정 | OpenAPI/Event 스키마 승인 |
| W2 | Appointment + Certificate BE 1차 구현 | 통합 테스트 통과 |
| W3 | FE 핵심 화면 + E2E 연결 | 핵심 사용자 시나리오 데모 완료 |
| W4 | Recruitment/Employee/Approval 연계 고도화 | 후속 자동화 시나리오 통과 |
| W5 | 운영 연동(S3/메일) + CI 게이트 강화 | 배포 리허설 통과 |
| W6 | 안정화/문서화/릴리즈 | Go-Live 체크리스트 승인 |

---

## 8. 실행 거버넌스

- **주간 운영**: PM 주관 Gap Burn-down 회의(주 2회)
- **품질 게이트**:
  1) API 계약 테스트 통과
  2) 이벤트 재처리 시나리오 통과
  3) 핵심 E2E 시나리오 통과
  4) 문서(모듈/Traceability/상태) 동시 업데이트
- **리스크 관리**:
  - 외부 연동(S3/메일) 지연 시 feature flag로 단계적 오픈
  - 이벤트 정합성 이슈 대비 DLQ 대시보드 및 재처리 Runbook 운영

---

## 9. 즉시 실행 액션 (Next 10 Business Days)

1. **Gap Backlog 확정 워크숍(반나절)**: BE/FE/QA/PO 참여, 본 문서 ID 기준 우선순위 확정
2. **P0 계약 선확정(2일)**: Appointment/Certificate API+Event 스펙 동결
3. **병렬 구현 착수(5일)**: BE 코어 연동 + FE 화면 skeleton 동시 진행
4. **통합 검증(2일)**: E2E 5종 + 장애 주입(이벤트 중복/지연) 테스트
5. **리뷰/재계획(1일)**: 잔여 P1/P2 재산정 및 다음 스프린트 이관

---

## 10. 기대 효과

- "구현률 100%"와 "운영 가능성" 사이의 간극을 해소하여 실사용 전환 속도 향상
- 요구사항 단위를 **기능 설명 → 계약/테스트 가능한 명세**로 전환
- FE/BE/QA가 동일한 Gap 백로그와 완료 기준으로 협업 가능
