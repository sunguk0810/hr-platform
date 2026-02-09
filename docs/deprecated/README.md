# Deprecated 문서 안내

> **최종 업데이트**: 2026-02-09

---

## 이 디렉토리의 문서에 대하여

이 디렉토리의 SDD(Software Design Document) 문서들은 **초기 설계 단계**에서 작성되었으며, 이후 기술 스택이 변경되어 현재 구현과 **불일치**합니다.

### 주요 기술 변경 사항

| 항목 | 초기 설계 (Deprecated) | 현재 구현 |
|------|----------------------|----------|
| **메시징** | Apache Kafka 3.x | **AWS SQS + SNS** (spring-cloud-aws 3.1.1) |
| **인증** | Keycloak 23.x (OAuth 2.0/OIDC) | **Custom JWT** (Spring Security) |
| **API Gateway** | Spring Cloud Gateway | **Traefik v3.3** |
| **컨테이너** | Kubernetes (EKS) 직접 관리 | **ECS Fargate** (관리형) |

> 기술 전환 상세 배경은 [MIGRATION_GUIDE.md](../architecture/MIGRATION_GUIDE.md) (Phase 3 생성 예정) 참조

---

## 문서 목록 및 대체 문서

| Deprecated 문서 | 내용 | 현재 참조해야 할 문서 |
|----------------|------|-------------------|
| `SDD_Auth_Service.md` | 인증 서비스 설계 (Keycloak 기반) | [docs/modules/01-AUTH-SERVICE.md](../modules/01-AUTH-SERVICE.md) |
| `SDD_Tenant_Service.md` | 테넌트 서비스 설계 (Kafka 기반) | [docs/modules/02-TENANT-SERVICE.md](../modules/02-TENANT-SERVICE.md) |
| `SDD_MDM_Service.md` | 기준정보 서비스 설계 | [docs/modules/03-MDM-SERVICE.md](../modules/03-MDM-SERVICE.md) |
| `SDD_Employee_Service.md` | 인사 서비스 설계 | [docs/modules/05-EMPLOYEE-SERVICE.md](../modules/05-EMPLOYEE-SERVICE.md) |
| `SDD_Approval_Service.md` | 결재 서비스 설계 | [docs/modules/07-APPROVAL-SERVICE.md](../modules/07-APPROVAL-SERVICE.md) |
| `SDD_Gateway_Service.md` | API Gateway 설계 | [docs/operations/DOCKER_GUIDE.md](../operations/DOCKER_GUIDE.md) (Traefik 섹션) |
| `SDD_Infrastructure.md` | 인프라 설계 (Kafka/EKS) | [docs/operations/AWS_INFRASTRUCTURE.md](../operations/AWS_INFRASTRUCTURE.md) |
| `SDD_Common_Modules.md` | 공통 모듈 설계 | [docs/architecture/](../architecture/) 디렉토리 전체 |
| `SDD_FRONTEND.md` | 프론트엔드 설계 | [docs/frontend/FRONTEND_SCREEN_INVENTORY.md](../frontend/FRONTEND_SCREEN_INVENTORY.md) |

---

## 여전히 유효한 내용

Deprecated 문서에서 다음 내용은 **현재도 유효**합니다:

### 도메인 모델 및 비즈니스 로직
- 엔티티 관계도 (ERD)
- 비즈니스 규칙 정의
- API 엔드포인트 목록 (대부분 동일)
- 데이터 검증 규칙

### 보안 정책
- RBAC 역할 정의 (역할 이름/계층 동일)
- 개인정보 마스킹 규칙
- 감사 로그 요구사항

### 무효한 내용 (주의)
- Kafka 토픽/컨슈머 설정 → SQS/SNS로 변경
- Keycloak Realm/Client 설정 → Custom JWT로 변경
- Spring Cloud Gateway 라우팅 → Traefik으로 변경
- Kubernetes Deployment/Service → ECS Task Definition으로 변경

---

## 삭제하지 않는 이유

1. **설계 의도 보존**: 왜 이런 설계를 했는지 맥락을 제공
2. **도메인 지식**: 비즈니스 로직 설명은 여전히 유효
3. **마이그레이션 참조**: 향후 기술 재전환 시 참고 자료
4. **감사 추적**: 아키텍처 결정의 이력 보존

---

## 현재 문서 구조 안내

최신 문서는 다음 디렉토리에서 찾을 수 있습니다:

| 디렉토리 | 내용 |
|---------|------|
| `docs/modules/` | 12개 서비스별 상세 정책 (프로덕션 기준) |
| `docs/architecture/` | 공통 아키텍처 패턴 (보안, RLS, 캐싱, DB) |
| `docs/operations/` | DevOps 가이드 (Docker, AWS, CI/CD, 모니터링) |
| `docs/api/` | API 설계 규칙, FE-BE 통합 가이드 |
