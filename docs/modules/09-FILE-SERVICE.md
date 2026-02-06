# Module 09: File Service (파일 관리)

> 분석일: 2026-02-06
> 포트: 8089
> 패키지: `com.hrsaas.file`
> DB 스키마: `hr_file`

---

## 1. 현재 구현 상태 요약

### 1.1 완료된 기능

| 기능 | 상태 | 설명 |
|------|------|------|
| 파일 업로드 (단건) | ✅ 완료 | MultipartFile 수신, 메타데이터 저장, StorageService 위임 |
| 파일 업로드 (다건) | ✅ 완료 | 다중 파일 순차 업로드 |
| 파일 다운로드 | ✅ 완료 | Resource 반환, Content-Type + UTF-8 파일명 헤더 설정 |
| Presigned URL | ✅ 완료 | S3 사전 서명 URL 생성 (기본 60분 만료) |
| 파일 메타데이터 조회 | ✅ 완료 | ID 조회, 참조(referenceType+referenceId) 조회, 내 파일 목록 |
| 파일 삭제 | ✅ 완료 | 업로더 소유권 검증, 물리 파일 + 메타데이터 삭제 |
| S3 스토리지 | ✅ 완료 | AWS SDK v2 기반 S3 CRUD, Presigned URL, LocalStack 지원 |
| 로컬 스토리지 | ✅ 완료 | 로컬 파일시스템 CRUD, 개발 환경용 |
| Strategy Pattern | ✅ 완료 | StorageStrategy 인터페이스 + S3/Local 구현체, 자동 발견 |
| SHA-256 체크섬 | ✅ 완료 | 업로드 시 파일 무결성 해시 계산 |
| 다운로드 카운터 | ✅ 완료 | 다운로드 시 자동 카운트 증가 |
| 테넌트별 경로 분리 | ✅ 완료 | `{tenantId}/{yyyy/MM/dd}/{storedName}` 경로 구조 |
| 파일명 UUID 변환 | ✅ 완료 | 원본 파일명 → UUID + 확장자로 저장 |
| 파일 크기 검증 | ✅ 완료 | 글로벌 최대 크기 (100MB) 검증 |
| RLS | ✅ 완료 | file_metadata 테이블 RLS 적용 |
| ddl-auto: validate | ✅ 올바름 | Flyway 마이그레이션 + validate 모드 |

### 1.2 미구현 / 갭

| 갭 ID | 기능 | 우선순위 | 설명 |
|--------|------|----------|------|
| FILE-G01 | 테넌트별 파일 정책 | HIGH | 허용 확장자, 최대 크기, 스토리지 쿼터 — TODO 스텁 → **정책결정: 구현** (§2.1) |
| FILE-G02 | 확장자 화이트리스트 | HIGH | 파일 확장자/MIME 타입 검증 없음 (모든 파일 허용) → 테넌트 정책으로 관리 (§2.1) |
| FILE-G03 | 스토리지 쿼터 | MEDIUM | getTotalStorageByTenant 쿼리 존재하나 쿼터 제한 로직 없음 (§2.1) |
| FILE-G04 | NFS 스토리지 구현 | LOW | StorageType.NFS enum 존재하나 NfsStorageStrategy 미구현 |
| FILE-G05 | 파일 버전 관리 | LOW | 동일 reference에 대한 파일 버전 관리/이력 없음 |
| FILE-G06 | 이미지 썸네일 | LOW | 이미지 파일 업로드 시 썸네일 자동 생성 없음 |
| FILE-G07 | 파일 공유 링크 | LOW | isPublic 필드 존재하나 공개 파일 접근 API 없음 |
| FILE-G08 | 관리자 파일 삭제 | MEDIUM | 현재 업로더만 삭제 가능, 관리자 삭제 권한 필요 → **정책결정: 업로더+관리자** (§2.3) |
| FILE-G09 | 고아 파일 정리 | MEDIUM | reference 삭제 시 연결된 파일 자동 정리 없음 |
| FILE-G10 | 파일 사용량 대시보드 | LOW | 테넌트별 스토리지 사용량, 파일 유형별 통계 API 없음 |

---

## 2. 정책 결정사항

### 2.1 테넌트별 파일 업로드 정책 ✅ 결정완료

> **결정: 테넌트별 정책 구현**

- 테넌트 정책 항목:
  - `maxFileSize`: 테넌트별 최대 파일 크기 (기본: 100MB, 테넌트별 축소 가능)
  - `allowedExtensions`: 허용 파일 확장자 목록 (기본: `.pdf,.docx,.xlsx,.pptx,.jpg,.jpeg,.png,.gif,.zip`)
  - `maxTotalStorageBytes`: 테넌트별 총 스토리지 쿼터 (기본: 10GB)
- 정책 조회: tenant-service Feign 클라이언트 또는 캐시된 설정
- 업로드 시 3단계 검증:
  1. 글로벌 크기 제한 (100MB)
  2. 테넌트별 크기 제한 (≤ 글로벌)
  3. 확장자 화이트리스트
  4. 스토리지 쿼터 잔여량

### 2.2 프로덕션 스토리지 ✅ 결정완료

> **결정: AWS S3 (프로덕션), LOCAL (개발)**

- 환경별 설정:
  - `dev`: LOCAL (./uploads) 또는 LocalStack S3
  - `staging`: LocalStack S3
  - `prod`: AWS S3 (`hr-platform-files` 버킷)
- `file.storage.default` 환경변수로 전환
- S3 버킷 정책: 서버 사이드 암호화 (SSE-S3), 버전 관리 활성화 권장

### 2.3 파일 접근 권한 ✅ 결정완료

> **결정: 같은 테넌트 내 자유 접근**

- **다운로드**: 동일 테넌트 사용자는 모든 파일 다운로드 가능 (RLS가 테넌트 격리 보장)
- **삭제**: 업로더 본인 + HR_ADMIN/TENANT_ADMIN/SUPER_ADMIN
- **업로드**: 인증된 사용자 누구나
- **Presigned URL**: 인증된 사용자 누구나 생성 가능 (URL 자체는 인증 없이 접근)
- `isPublic` 플래그: 향후 테넌트 간 공유 또는 외부 공개 시 사용 (현재 미사용)

### 2.4 바이러스 스캔 ✅ 결정완료

> **결정: 불필요**

- HR 내부 시스템이므로 바이러스 스캔 불필요
- 추후 필요 시 AWS S3 Malware Protection 또는 ClamAV 연동 고려

---

## 3. 아키텍처

### 3.1 서비스 구조

```
com.hrsaas.file/
├── config/
│   ├── SecurityConfig.java            # 보안 설정 (JWT 필터)
│   └── S3Config.java                  # AWS S3Client + S3Presigner 빈 설정
├── controller/
│   └── FileController.java            # 파일 REST API (8 엔드포인트)
├── service/
│   ├── FileService.java               # 인터페이스 (8 메서드)
│   └── impl/FileServiceImpl.java      # 구현체
├── storage/
│   ├── StorageStrategy.java           # 전략 인터페이스 (store/retrieve/delete/exists/presignedUrl)
│   ├── StorageService.java            # 전략 라우터 (Strategy Map + 기본 타입 설정)
│   ├── S3StorageStrategy.java         # AWS S3 구현
│   └── LocalStorageStrategy.java      # 로컬 파일시스템 구현
├── repository/
│   └── FileMetadataRepository.java    # 파일 메타데이터 (4 쿼리)
└── domain/
    ├── entity/
    │   ├── FileMetadata.java          # 파일 메타데이터 엔티티
    │   └── StorageType.java           # S3/LOCAL/NFS enum
    └── dto/
        └── response/FileResponse.java # 파일 응답 DTO
```

### 3.2 스토리지 Strategy Pattern

```
FileServiceImpl
  │
  ▼
StorageService (라우터)
  │  strategies: Map<StorageType, StorageStrategy>
  │  defaultStorageType: LOCAL (dev) / S3 (prod)
  │
  ├─ S3StorageStrategy
  │    - S3Client + S3Presigner
  │    - 버킷: hr-platform-files
  │    - Presigned URL 지원
  │    - LocalStack 연동 (dev)
  │
  ├─ LocalStorageStrategy
  │    - 로컬 디렉토리: ./uploads
  │    - NIO Path API
  │    - Presigned URL → 다운로드 URL 반환
  │
  └─ (NfsStorageStrategy) ← 미구현 (FILE-G04)
```

### 3.3 파일 저장 경로 규칙

```
{tenantId}/{yyyy}/{MM}/{dd}/{UUID}.{extension}

예: 550e8400-e29b-41d4-a716-446655440000/2026/02/06/c7e3a4f2-8b1c-4d5e-9f3a-2b6c8d7e1f0a.pdf
```

- 테넌트별 디렉토리 분리
- 날짜별 하위 디렉토리 (파일 분산)
- UUID 기반 파일명 (충돌 방지)
- 원본 확장자 유지

---

## 4. API 엔드포인트

### 4.1 파일 (`/api/v1/files`)

| Method | Path | 설명 | 권한 | Content-Type |
|--------|------|------|------|-------------|
| POST | `/` | 파일 업로드 (단건) | 인증 필요 | multipart/form-data |
| POST | `/multiple` | 파일 업로드 (다건) | 인증 필요 | multipart/form-data |
| GET | `/{id}` | 파일 메타데이터 조회 | 인증 필요 | application/json |
| GET | `/reference/{referenceType}/{referenceId}` | 참조별 파일 목록 | 인증 필요 | application/json |
| GET | `/my` | 내 파일 목록 (페이징) | 인증 필요 | application/json |
| GET | `/{id}/download` | 파일 다운로드 | 인증 필요 | 파일 MIME 타입 |
| GET | `/{id}/presigned-url` | Presigned URL 생성 | 인증 필요 | application/json |
| DELETE | `/{id}` | 파일 삭제 | 인증 필요 (업로더 본인) | - |

**업로드 요청 파라미터:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| file / files | MultipartFile | ✅ | 업로드할 파일 |
| referenceType | String | | 참조 엔티티 유형 (EMPLOYEE, APPROVAL, LEAVE 등) |
| referenceId | UUID | | 참조 엔티티 ID |
| isPublic | Boolean | | 공개 여부 (기본: false) |

**요청 헤더:**
| 헤더 | 필수 | 설명 |
|------|------|------|
| X-User-ID | ✅ | 업로더 UUID |
| X-User-Name | | 업로더 이름 |

**다운로드 응답 헤더:**
```
Content-Type: {원본 MIME 타입}
Content-Disposition: attachment; filename*=UTF-8''{인코딩된 파일명}
```

---

## 5. 엔티티 모델

### 5.1 file_metadata (파일 메타데이터)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| tenant_id | UUID | NOT NULL | RLS 대상 |
| original_name | VARCHAR(500) | NOT NULL | 원본 파일명 |
| stored_name | VARCHAR(500) | NOT NULL, UNIQUE | 저장된 파일명 (UUID+확장자) |
| content_type | VARCHAR(255) | NOT NULL | MIME 타입 |
| file_size | BIGINT | NOT NULL | 파일 크기 (bytes) |
| storage_path | VARCHAR(1000) | NOT NULL | 저장 경로 |
| bucket_name | VARCHAR(255) | | S3 버킷명 (S3 타입만) |
| storage_type | VARCHAR(20) | DEFAULT 'S3' | S3 / LOCAL / NFS |
| reference_type | VARCHAR(50) | | 참조 엔티티 유형 |
| reference_id | UUID | | 참조 엔티티 ID |
| uploader_id | UUID | NOT NULL | 업로더 ID |
| uploader_name | VARCHAR(100) | | 업로더 이름 |
| is_public | BOOLEAN | DEFAULT false | 공개 여부 |
| download_count | INTEGER | DEFAULT 0 | 다운로드 횟수 |
| checksum | VARCHAR(128) | | SHA-256 체크섬 |
| created_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | |
| created_by | VARCHAR(100) | | |
| updated_by | VARCHAR(100) | | |

**인덱스:**
- `tenant_id` — 기본 테넌트 필터
- `(tenant_id, uploader_id)` — 내 파일 조회
- `(tenant_id, reference_type, reference_id)` — 참조 엔티티별 조회
- `(tenant_id, content_type)` — MIME 타입별 필터
- `(tenant_id, storage_type)` — 스토리지 유형별 관리
- `(tenant_id, created_at DESC)` — 최신 파일 조회
- `(is_public) WHERE is_public = TRUE` — 공개 파일 부분 인덱스

---

## 6. StorageStrategy 인터페이스

```java
public interface StorageStrategy {
    StorageResult store(InputStream inputStream, String storagePath,
                        String contentType, long fileSize);
    InputStream retrieve(String storagePath);
    boolean delete(String storagePath);
    boolean exists(String storagePath);
    String generatePresignedUrl(String storagePath, int expirationMinutes);
    StorageType getStorageType();

    record StorageResult(String path, String bucket, StorageType storageType) {}
}
```

### 6.1 S3StorageStrategy

| 메서드 | AWS API | 설명 |
|--------|---------|------|
| store | PutObjectRequest | S3 버킷에 파일 업로드 |
| retrieve | GetObjectRequest | S3에서 InputStream 반환 |
| delete | DeleteObjectRequest | S3 객체 삭제 |
| exists | HeadObjectRequest | 객체 존재 확인 |
| generatePresignedUrl | S3Presigner.presignGetObject | 시간 제한 서명 URL |

**설정:**
- 버킷: `aws.s3.bucket` (기본: `hr-platform-files`)
- 엔드포인트: `aws.s3.endpoint` (LocalStack 시 설정)
- `forcePathStyle: true` (LocalStack 호환)

### 6.2 LocalStorageStrategy

| 메서드 | 구현 | 설명 |
|--------|------|------|
| store | Files.copy | 로컬 디렉토리에 파일 복사, 디렉토리 자동 생성 |
| retrieve | FileInputStream | 로컬 파일 읽기 |
| delete | Files.deleteIfExists | 로컬 파일 삭제 |
| exists | Files.exists | 로컬 파일 존재 확인 |
| generatePresignedUrl | - | Presigned URL 미지원, 다운로드 URL 반환 |

**설정:**
- 업로드 경로: `file.upload.path` (기본: `./uploads`)

---

## 7. 설정값

### 7.1 application.yml

```yaml
server:
  port: 8089

spring:
  application:
    name: file-service
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
        default_schema: hr_file
  flyway:
    enabled: true
    locations: classpath:db/migration
    schemas: hr_file
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6381}
      password: ${REDIS_PASSWORD:redis_password}
  servlet:
    multipart:
      max-file-size: 100MB
      max-request-size: 100MB

aws:
  region: ${AWS_REGION:ap-northeast-2}
  s3:
    bucket: ${AWS_S3_BUCKET:hr-platform-files}
    endpoint: ${AWS_S3_ENDPOINT:}        # LocalStack: http://localhost:4566
  access-key: ${AWS_ACCESS_KEY:}
  secret-key: ${AWS_SECRET_KEY:}

file:
  storage:
    default: ${FILE_STORAGE_DEFAULT:LOCAL}  # LOCAL (dev), S3 (prod)
  upload:
    path: ${FILE_UPLOAD_PATH:./uploads}
  download:
    base-url: /api/v1/files
  max-size: 104857600                       # 100MB (글로벌)

jwt:
  secret: ${JWT_SECRET:...}
  access-token-expiry: 1800
  refresh-token-expiry: 604800
```

### 7.2 build.gradle 의존성

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
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'

    // Spring Cloud
    implementation 'org.springframework.cloud:spring-cloud-starter-openfeign'
    implementation 'org.springframework.cloud:spring-cloud-starter-circuitbreaker-resilience4j'

    // AWS S3
    implementation platform('software.amazon.awssdk:bom:2.21.0')
    implementation 'software.amazon.awssdk:s3'

    // Database
    runtimeOnly 'org.postgresql:postgresql'
    implementation 'org.flywaydb:flyway-core'

    // Testing
    testImplementation 'org.testcontainers:postgresql'
    testImplementation 'org.testcontainers:localstack'
    testImplementation 'org.testcontainers:junit-jupiter'
}
```

---

## 8. 에러코드

| 코드 | HTTP | 메시지 | 발생 위치 |
|------|------|--------|----------|
| FILE_001 | 500 | 파일 업로드에 실패했습니다 | FileServiceImpl.upload() — IOException |
| FILE_002 | 404 | 파일을 찾을 수 없습니다 | FileServiceImpl.findById(), download() |
| FILE_004 | 403 | 본인이 업로드한 파일만 삭제할 수 있습니다 | FileServiceImpl.delete() — 소유권 검증 실패 |
| FILE_006 | 400 | 파일이 비어있습니다 | FileServiceImpl.validateFile() — null/empty |
| FILE_007 | 400 | 파일 크기가 제한을 초과했습니다 | FileServiceImpl.validateFile() — maxFileSize 초과 |

---

## 9. 갭 구현 사양

### FILE-G01: 테넌트별 파일 업로드 정책 (HIGH) — 정책결정 완료

**정책:** 테넌트별 허용 확장자, 최대 크기, 스토리지 쿼터 관리

**구현 방향:**
1. **테넌트 정책 모델 (tenant-service 연동):**
   ```java
   public class TenantFilePolicy {
       Long maxFileSize;                    // 테넌트별 최대 크기 (null = 글로벌)
       List<String> allowedExtensions;     // 허용 확장자 [".pdf", ".docx", ...]
       Long maxTotalStorageBytes;          // 총 스토리지 쿼터 (기본 10GB)
   }
   ```

2. **validateFile() 확장:**
   ```java
   private void validateFile(MultipartFile file) {
       // 1. 빈 파일 검증
       // 2. 글로벌 크기 제한 (100MB)
       // 3. 테넌트 정책 조회 (Feign + Redis 캐시)
       TenantFilePolicy policy = tenantPolicyClient.getFileUploadPolicy(tenantId);
       if (policy != null) {
           // 4. 테넌트 크기 제한
           if (policy.getMaxFileSize() != null && file.getSize() > policy.getMaxFileSize()) {
               throw new BusinessException("FILE_008", "테넌트 파일 크기 제한 초과");
           }
           // 5. 확장자 검증
           String ext = getFileExtension(file.getOriginalFilename());
           if (policy.getAllowedExtensions() != null && !policy.getAllowedExtensions().contains(ext)) {
               throw new BusinessException("FILE_009", "허용되지 않는 파일 형식입니다: " + ext);
           }
           // 6. 스토리지 쿼터
           Long totalUsage = fileMetadataRepository.getTotalStorageByTenant(tenantId);
           if (policy.getMaxTotalStorageBytes() != null &&
               (totalUsage + file.getSize()) > policy.getMaxTotalStorageBytes()) {
               throw new BusinessException("FILE_010", "스토리지 쿼터를 초과합니다");
           }
       }
   }
   ```

3. **에러코드 추가:**
   - FILE_008: 테넌트 파일 크기 제한 초과
   - FILE_009: 허용되지 않는 파일 형식
   - FILE_010: 스토리지 쿼터 초과

4. **기본 허용 확장자:**
   ```
   문서: .pdf, .docx, .doc, .xlsx, .xls, .pptx, .ppt, .hwp, .txt, .csv
   이미지: .jpg, .jpeg, .png, .gif, .bmp, .svg
   압축: .zip, .tar, .gz
   ```

### FILE-G08: 관리자 파일 삭제 (MEDIUM) — 정책결정 완료

**정책:** 업로더 + 관리자 삭제 가능

**구현 방향:**
```java
@Override
@Transactional
public void delete(UUID id, UUID requesterId) {
    FileMetadata metadata = findById(id);

    // 업로더 본인 또는 관리자만 삭제 가능
    boolean isUploader = metadata.getUploaderId().equals(requesterId);
    boolean isAdmin = SecurityContextHolder.hasAnyRole("HR_ADMIN", "TENANT_ADMIN", "SUPER_ADMIN");

    if (!isUploader && !isAdmin) {
        throw new ForbiddenException("FILE_004", "파일 삭제 권한이 없습니다");
    }

    // 물리 파일 삭제 + 메타데이터 삭제
    storageService.delete(metadata.getStoragePath(), metadata.getStorageType());
    fileMetadataRepository.delete(metadata);
}
```

### FILE-G09: 고아 파일 정리 (MEDIUM)

**구현 방향:**
- 이벤트 기반: 엔티티 삭제 시 관련 파일 삭제 이벤트 수신
- 스케줄러 기반 (보조): 매주 1회 참조 유효성 검사
  - reference가 설정된 파일에 대해 해당 엔티티 존재 여부 확인
  - 존재하지 않는 참조의 파일을 후보로 마킹 → 30일 후 삭제

---

## 10. 테스트 시나리오

### 10.1 단위 테스트

| 대상 | 시나리오 | 검증 항목 |
|------|---------|----------|
| FileServiceImpl | upload_validFile_createsMetadata | 업로드 성공, 메타데이터 저장 확인 |
| FileServiceImpl | upload_emptyFile_throwsException | 빈 파일 거부 (FILE_006) |
| FileServiceImpl | upload_tooLarge_throwsException | 100MB 초과 거부 (FILE_007) |
| FileServiceImpl | upload_checksumCalculated | SHA-256 체크섬 생성 확인 |
| FileServiceImpl | download_incrementsCount | 다운로드 시 카운트 +1 |
| FileServiceImpl | download_fileNotFound_throwsException | 존재하지 않는 파일 (FILE_002) |
| FileServiceImpl | delete_byUploader_success | 업로더 본인 삭제 성공 |
| FileServiceImpl | delete_notUploader_throwsForbidden | 타인 삭제 거부 (FILE_004) |
| FileServiceImpl | getByReference_returnsList | 참조별 파일 목록 조회 |
| FileServiceImpl | generateStoredName_uuidWithExtension | UUID + 확장자 파일명 |
| FileServiceImpl | generateStoragePath_tenantDatePath | 테넌트/날짜/파일 경로 |
| S3StorageStrategy | store_putsObject | S3 PutObject 호출 확인 |
| S3StorageStrategy | retrieve_getsObject | S3 GetObject 호출 확인 |
| S3StorageStrategy | delete_deletesObject | S3 DeleteObject 호출 확인 |
| S3StorageStrategy | presignedUrl_generatesUrl | Presigned URL 생성 확인 |
| LocalStorageStrategy | store_createsFile | 로컬 파일 생성 확인 |
| LocalStorageStrategy | retrieve_readsFile | 로컬 파일 읽기 확인 |
| LocalStorageStrategy | delete_removesFile | 로컬 파일 삭제 확인 |
| StorageService | store_defaultStrategy_usesLocal | 기본 전략 사용 확인 |
| StorageService | store_s3Strategy_usesS3 | S3 전략 명시 시 사용 확인 |
| StorageService | unknownType_throwsException | 미지원 스토리지 타입 에러 |

### 10.2 통합 테스트

| 시나리오 | 검증 항목 |
|---------|----------|
| 파일 업로드 → 다운로드 | 업로드 후 동일 파일 다운로드 성공, 체크섬 일치 |
| 다중 파일 업로드 | 3개 파일 업로드 → 3개 메타데이터 생성 |
| 참조별 파일 조회 | EMPLOYEE/{id} 참조 파일 3개 업로드 → 목록 조회 확인 |
| Presigned URL | URL 생성 → URL로 직접 다운로드 가능 확인 |
| 파일 삭제 | 삭제 → 메타데이터 삭제 + 물리 파일 삭제 |
| RLS 테넌트 격리 | A 테넌트 파일을 B 테넌트에서 조회 불가 |
| S3 + LocalStack | LocalStack S3로 전체 CRUD 동작 확인 |

---

## 11. 의존성

### 11.1 이 서비스가 호출하는 서비스

| 대상 서비스 | 방식 | 용도 |
|------------|------|------|
| tenant-service | Feign (예정) | 테넌트별 파일 업로드 정책 조회 (FILE-G01) |

### 11.2 이 서비스를 호출하는 서비스

| 호출 서비스 | 방식 | 용도 |
|------------|------|------|
| (다른 모든 서비스) | REST API | 파일 업로드/다운로드/삭제 |

### 11.3 외부 서비스

| 대상 | 방식 | 용도 |
|------|------|------|
| AWS S3 | AWS SDK v2 (S3Client, S3Presigner) | 파일 저장소 (프로덕션) |
| LocalStack | S3 호환 엔드포인트 | 파일 저장소 (개발) |

### 11.4 발행/구독 이벤트

**없음** — file-service는 이벤트를 발행하거나 구독하지 않음

---

## 12. SQL 마이그레이션 요약

| 파일 | 내용 |
|------|------|
| V1__init.sql | 스키마 생성, 1개 테이블 (file_metadata), RLS 정책, 7개 인덱스, `get_current_tenant_safe()` 함수 |

**총 1개 테이블, 1개 RLS 대상 테이블**
