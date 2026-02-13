# Backend ↔ Frontend Contract Alignment (P0 우선)

작성일: 2026-02-12  
대상: Appointment / Certificate / File  
근거: `/docs/status/CURRENT_STATUS.md`, `/docs/requirements/TRACEABILITY_MATRIX.md`

## 1) 배경

이번 P0는 기능 완성도가 아닌 **실행 중인 계약 불일치 수습**을 목표로 한다.  
특히 `400/500` 발생 포인트를 줄이고, FE mock/API 경로를 동일 계약으로 맞춘다.

## 2) 잘못된 진단 정정 (요약)

### 정정 항목
- `AppointmentSummary`는 BE에 이미 존재함 (`/api/v1/appointments/drafts/summary`)  
  → 문서에서 “미구현”으로 분류되던 항목은 `BE 구현 확인`으로 정정.

### 확인 필요로 남은 항목
- 아래 항목은 구현/연동 자체가 필요함: 검색 파라미터 계약, 파일럿 미리보기 경로, certificate 다운로드/필터 계약.

## 3) 목표 (DoD)

1. P0 API가 런타임 400/500 없이 동작
2. FE 타입/파라미터와 BE 계약 일치
3. mock/실서비스 동일 동작
4. 핵심 플로우 E2E 최소 1개 이상 통과

## 4) 계약 정렬 범위 (P0)

- Appointment / Certificate / File
- mock 핸들러도 동일 계약 반영
- preview는 별도 엔드포인트 생성 대신 `/files/{id}/download` 또는 `presigned`로 통일

## 5) 상세 REQ (P0)

### REQ-APP-01: Appointment 목록 조회
- FE 이전: `effectiveDateFrom/effectiveDateTo` 사용
- FE 이후: `startDate/endDate` 사용
- 수정 파일:
  - `frontend/packages/shared-types/src/api/appointment.ts`
  - `frontend/apps/web/src/features/appointment/hooks/useAppointments.ts`
  - `frontend/apps/web/src/features/appointment/services/appointmentService.ts`
- AC:
  - 날짜 파라미터 누락 없음(`startDate`,`endDate` 포함)
  - keyword는 BE 미지원 시 UI 경고 표시

### REQ-APP-02: drafter null-safe
- FE에서 `draftCreatedBy`는 선택값으로 렌더링
- 수정 파일:
  - `frontend/packages/shared-types/src/api/appointment.ts`
  - `frontend/apps/web/src/features/appointment/pages/AppointmentListPage.tsx`
  - `frontend/apps/web/src/features/appointment/pages/AppointmentDetailPage.tsx`
- AC:
  - `draftCreatedBy` 누락 데이터에서도 화면 크래시 없음

### REQ-CERT-01: `/certificates/requests/my` 컨텍스트 기반 조회
- FE가 query를 보내지 않아도 동작
- BE `/api/v1/certificates/requests/my`는 인증 컨텍스트 기반 `employeeId` 추출
- 수정 파일:
  - `services/certificate-service/src/main/java/com/hrsaas/certificate/controller/CertificateRequestController.java`
  - `services/certificate-service/src/main/java/com/hrsaas/certificate/service/CertificateRequestService.java`
  - `services/certificate-service/src/main/java/com/hrsaas/certificate/service/impl/CertificateRequestServiceImpl.java`
  - `frontend/apps/web/src/features/certificate/services/certificateService.ts`

### REQ-CERT-02: 증명서 신청 생성 컨텍스트 주입
- FE/DTO에서 `employeeId` 제거
- BE에서 `SecurityContextHolder` 기반 주입
- 수정 파일:
  - `services/certificate-service/src/main/java/com/hrsaas/certificate/domain/dto/request/CreateCertificateRequestRequest.java`
  - `services/certificate-service/src/main/java/com/hrsaas/certificate/service/impl/CertificateRequestServiceImpl.java`
  - `frontend/packages/shared-types/src/api/certificate.ts`
  - `frontend/apps/web/src/features/certificate/pages/CertificateRequestPage.tsx`

### REQ-CERT-03: 발급본 다운로드 id 기반 정합
- FE: `/certificates/issues/{id}/download` 호출
- BE: 기존 id 기반 다운로드 유지
- 수정 파일:
  - `frontend/apps/web/src/features/certificate/services/certificateService.ts`
  - `frontend/apps/web/src/features/certificate/hooks/useCertificates.ts`
  - `frontend/apps/web/src/features/certificate/pages/CertificateIssueHistoryPage.tsx`
  - `frontend/apps/web/src/mocks/handlers/certificateHandlers.ts`

### REQ-CERT-04: 내 발급 목록 필터 반영
- BE `typeCode`, `includeExpired` 필터 적용
- 수정 파일:
  - `services/certificate-service/src/main/java/com/hrsaas/certificate/controller/CertificateIssueController.java`
  - `services/certificate-service/src/main/java/com/hrsaas/certificate/service/CertificateIssueService.java`
  - `services/certificate-service/src/main/java/com/hrsaas/certificate/service/impl/CertificateIssueServiceImpl.java`
  - `frontend/apps/web/src/mocks/handlers/certificateHandlers.ts`

### REQ-FILE-01: preview 계약 정렬
- `/files/{id}/preview`는 실제 API 미지원
- FE는 다운로드/사전서명 URL를 preview로 사용
- 수정 파일:
  - `frontend/apps/web/src/features/file/services/fileService.ts`
  - `frontend/apps/web/src/features/file/pages/FileManagementPage.tsx`
  - `frontend/apps/web/src/mocks/handlers/fileHandlers.ts`

## 6) 테스트 계획

### BE 통합
- `CertificateRequestServiceImpl` context 기반 `create`/`getMyRequests`
- `CertificateIssueServiceImpl` `getByEmployeeId(..., typeCode, includeExpired)`

### FE 계약 테스트
- certificate download path mutation 파라미터(id)
- appointment query 직렬화(startDate/endDate)
- 파일 preview URL이 download 경로 사용되는지

### mock parity
- msw 핸들러가 FE 경로와 동일 쿼리 키/파라미터 처리

## 7) 운영 전환 smoke
- 내 발령 목록 조회
- 내 증명서 신청/발급 이력 조회
- 증명서 PDF 다운로드
- 파일 이미지/PDF 미리보기

## 8) 실행 순서 (제안대로 고정)
1. 계약 타입/파라미터 정렬
2. Certificate 핵심 API 수정
3. Appointment 렌더 안전화
4. File preview 정렬
5. 문서/회귀 테스트 정리
