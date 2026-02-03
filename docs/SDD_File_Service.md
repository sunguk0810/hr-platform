# SDD: File Service (파일 관리 서비스)

## 1. 서비스 개요

### 1.1 목적
File Service는 HR SaaS 플랫폼의 모든 파일 업로드, 다운로드, 관리를 담당하는 서비스입니다. AWS S3를 스토리지로 활용하며, 테넌트별 격리와 보안을 보장합니다.

### 1.2 책임 범위
- 파일 업로드 (단일/다중, Multipart)
- 파일 다운로드 (Presigned URL)
- 파일 메타데이터 관리
- 테넌트별 스토리지 격리
- 파일 유형/크기 검증
- 바이러스 스캔 연동 (준비)
- 이미지 리사이징/썸네일 생성
- 파일 보존 기간 관리

### 1.3 Phase
**Phase 1 (MVP)**

---

## 2. 아키텍처

### 2.1 서비스 구조
```
┌─────────────────────────────────────────────────────────────┐
│                      File Service                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Upload    │  │  Download   │  │     Metadata        │ │
│  │   Handler   │  │   Handler   │  │     Manager         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Image     │  │  Retention  │  │     Virus Scan      │ │
│  │  Processor  │  │   Manager   │  │     (Prepared)      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────┬───────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐    ┌──────────┐
        │PostgreSQL│   │  AWS S3  │    │  Redis   │
        │ Metadata │   │ Storage  │    │ (Cache)  │
        └──────────┘   └──────────┘    └──────────┘
```

### 2.2 S3 버킷 구조
```
hr-saas-files-{environment}/
├── {tenant_id}/
│   ├── employees/
│   │   ├── photos/
│   │   ├── documents/
│   │   └── certificates/
│   ├── leaves/
│   │   └── attachments/
│   ├── approvals/
│   │   └── attachments/
│   ├── announcements/
│   │   └── attachments/
│   └── temp/
└── system/
    ├── templates/
    └── logos/
```

### 2.3 의존 서비스
| 서비스 | 통신 방식 | 용도 |
|--------|----------|------|
| Tenant Service | REST (OpenFeign) | 테넌트 스토리지 정책 조회 |
| AWS S3 | AWS SDK | 파일 저장소 |
| AWS Lambda | Event (준비) | 바이러스 스캔, 이미지 처리 |

---

## 3. 데이터 모델

### 3.1 ERD
```
┌─────────────────────────┐       ┌─────────────────────────┐
│      file_metadata      │       │    file_access_log      │
├─────────────────────────┤       ├─────────────────────────┤
│ id (PK, UUID)           │       │ id (PK, UUID)           │
│ tenant_id               │──────<│ file_id (FK)            │
│ original_name           │       │ accessed_by             │
│ stored_name             │       │ access_type             │
│ s3_key                  │       │ ip_address              │
│ s3_bucket               │       │ user_agent              │
│ content_type            │       │ created_at              │
│ file_size               │       └─────────────────────────┘
│ file_extension          │
│ category                │       ┌─────────────────────────┐
│ entity_type             │       │   file_thumbnail        │
│ entity_id               │       ├─────────────────────────┤
│ checksum                │       │ id (PK, UUID)           │
│ is_public               │       │ file_id (FK)            │
│ virus_scan_status       │       │ size_type               │
│ virus_scan_at           │       │ s3_key                  │
│ retention_until         │       │ width                   │
│ is_deleted              │       │ height                  │
│ deleted_at              │       │ created_at              │
│ created_by              │       └─────────────────────────┘
│ created_at              │
│ updated_at              │
└─────────────────────────┘
```

### 3.2 테이블 DDL

#### file_metadata (파일 메타데이터)
```sql
CREATE TABLE file_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    original_name VARCHAR(500) NOT NULL,
    stored_name VARCHAR(500) NOT NULL,
    s3_key VARCHAR(1000) NOT NULL,
    s3_bucket VARCHAR(100) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_extension VARCHAR(20),
    category VARCHAR(50) NOT NULL
        CHECK (category IN ('EMPLOYEE_PHOTO', 'EMPLOYEE_DOCUMENT', 'LEAVE_ATTACHMENT',
                           'APPROVAL_ATTACHMENT', 'ANNOUNCEMENT', 'TEMPLATE', 'OTHER')),
    entity_type VARCHAR(50),
    entity_id UUID,
    checksum VARCHAR(64),
    is_public BOOLEAN DEFAULT false,
    virus_scan_status VARCHAR(20) DEFAULT 'PENDING'
        CHECK (virus_scan_status IN ('PENDING', 'CLEAN', 'INFECTED', 'ERROR', 'SKIPPED')),
    virus_scan_at TIMESTAMP WITH TIME ZONE,
    retention_until DATE,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_file_s3_key UNIQUE (s3_bucket, s3_key)
);

-- 인덱스
CREATE INDEX idx_file_tenant ON file_metadata(tenant_id);
CREATE INDEX idx_file_entity ON file_metadata(entity_type, entity_id);
CREATE INDEX idx_file_category ON file_metadata(category);
CREATE INDEX idx_file_created ON file_metadata(created_at);
CREATE INDEX idx_file_retention ON file_metadata(retention_until) WHERE retention_until IS NOT NULL;
CREATE INDEX idx_file_deleted ON file_metadata(is_deleted) WHERE is_deleted = false;

-- RLS 정책
ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY file_metadata_isolation ON file_metadata
    USING (tenant_id = current_setting('app.current_tenant')::UUID 
           OR is_public = true);
```

#### file_thumbnail (썸네일)
```sql
CREATE TABLE file_thumbnail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES file_metadata(id) ON DELETE CASCADE,
    size_type VARCHAR(20) NOT NULL
        CHECK (size_type IN ('SMALL', 'MEDIUM', 'LARGE')),
    s3_key VARCHAR(1000) NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_thumbnail UNIQUE (file_id, size_type)
);

-- 썸네일 크기 정의
-- SMALL: 100x100
-- MEDIUM: 300x300
-- LARGE: 800x800
```

#### file_access_log (파일 접근 로그)
```sql
CREATE TABLE file_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    accessed_by UUID NOT NULL,
    access_type VARCHAR(20) NOT NULL
        CHECK (access_type IN ('VIEW', 'DOWNLOAD', 'DELETE')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- 월별 파티셔닝
CREATE TABLE file_access_log_2024_01 PARTITION OF file_access_log
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- 인덱스
CREATE INDEX idx_file_access_file ON file_access_log(file_id);
CREATE INDEX idx_file_access_user ON file_access_log(accessed_by);
```

---

## 4. API 명세

### 4.1 파일 업로드 API

#### 단일 파일 업로드
```
POST /api/v1/files/upload
Content-Type: multipart/form-data
```
**Request:**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| file | File | Y | 업로드 파일 |
| category | String | Y | 파일 카테고리 |
| entityType | String | N | 연관 엔티티 타입 |
| entityId | UUID | N | 연관 엔티티 ID |
| isPublic | Boolean | N | 공개 여부 (default: false) |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "originalName": "profile.jpg",
    "storedName": "550e8400-e29b-41d4-a716-446655440000.jpg",
    "contentType": "image/jpeg",
    "fileSize": 102400,
    "category": "EMPLOYEE_PHOTO",
    "downloadUrl": "https://presigned-url...",
    "thumbnails": {
      "small": "https://presigned-url...",
      "medium": "https://presigned-url..."
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 다중 파일 업로드
```
POST /api/v1/files/upload/multiple
Content-Type: multipart/form-data
```
**Request:**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| files | File[] | Y | 업로드 파일들 (최대 10개) |
| category | String | Y | 파일 카테고리 |
| entityType | String | N | 연관 엔티티 타입 |
| entityId | UUID | N | 연관 엔티티 ID |

#### Presigned URL 발급 (대용량 파일)
```
POST /api/v1/files/presigned-url
```
**Request:**
```json
{
  "fileName": "large-document.pdf",
  "contentType": "application/pdf",
  "fileSize": 52428800,
  "category": "EMPLOYEE_DOCUMENT"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.presigned-url...",
    "fileId": "uuid",
    "s3Key": "tenant-id/employees/documents/uuid.pdf",
    "expiresAt": "2024-01-15T11:30:00Z"
  }
}
```

#### Presigned URL 업로드 완료 확인
```
POST /api/v1/files/{fileId}/confirm
```

### 4.2 파일 다운로드 API

#### 파일 다운로드 URL 조회
```
GET /api/v1/files/{fileId}/download
```
**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://presigned-url...",
    "fileName": "document.pdf",
    "contentType": "application/pdf",
    "fileSize": 1024000,
    "expiresAt": "2024-01-15T11:30:00Z"
  }
}
```

#### 파일 직접 다운로드 (스트리밍)
```
GET /api/v1/files/{fileId}/stream
```
**Response:** Binary file stream with headers

#### 썸네일 조회
```
GET /api/v1/files/{fileId}/thumbnail
```
**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| size | String | N | SMALL, MEDIUM, LARGE (default: MEDIUM) |

### 4.3 파일 관리 API

#### 파일 메타데이터 조회
```
GET /api/v1/files/{fileId}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "originalName": "contract.pdf",
    "contentType": "application/pdf",
    "fileSize": 1024000,
    "category": "EMPLOYEE_DOCUMENT",
    "entityType": "EMPLOYEE",
    "entityId": "employee-uuid",
    "virusScanStatus": "CLEAN",
    "isPublic": false,
    "createdBy": {
      "id": "uuid",
      "name": "홍길동"
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 파일 목록 조회
```
GET /api/v1/files
```
**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| category | String | N | 카테고리 필터 |
| entityType | String | N | 엔티티 타입 |
| entityId | UUID | N | 엔티티 ID |
| page | Integer | N | 페이지 |
| size | Integer | N | 크기 |

#### 엔티티별 파일 목록 조회
```
GET /api/v1/files/entity/{entityType}/{entityId}
```

#### 파일 삭제
```
DELETE /api/v1/files/{fileId}
```

#### 파일 일괄 삭제
```
DELETE /api/v1/files/batch
```
**Request:**
```json
{
  "fileIds": ["uuid1", "uuid2", "uuid3"]
}
```

### 4.4 관리자 API

#### 스토리지 사용량 조회
```
GET /api/v1/files/admin/storage-usage
```
**Response:**
```json
{
  "success": true,
  "data": {
    "tenantId": "uuid",
    "totalFiles": 15000,
    "totalSize": 5368709120,
    "totalSizeFormatted": "5.0 GB",
    "byCategory": [
      {
        "category": "EMPLOYEE_PHOTO",
        "fileCount": 5000,
        "totalSize": 1073741824,
        "percentage": 20
      },
      {
        "category": "EMPLOYEE_DOCUMENT",
        "fileCount": 8000,
        "totalSize": 3221225472,
        "percentage": 60
      }
    ],
    "limit": 10737418240,
    "usagePercentage": 50
  }
}
```

#### 만료 파일 정리 (수동)
```
POST /api/v1/files/admin/cleanup-expired
```

---

## 5. 비즈니스 로직

### 5.1 파일 업로드 처리

```java
@Service
@RequiredArgsConstructor
public class FileUploadService {
    
    private final FileMetadataRepository metadataRepository;
    private final S3Client s3Client;
    private final ImageProcessingService imageService;
    private final FileValidationService validationService;
    
    private static final Map<String, Long> MAX_FILE_SIZES = Map.of(
        "EMPLOYEE_PHOTO", 5 * 1024 * 1024L,      // 5MB
        "EMPLOYEE_DOCUMENT", 50 * 1024 * 1024L,  // 50MB
        "LEAVE_ATTACHMENT", 10 * 1024 * 1024L,   // 10MB
        "APPROVAL_ATTACHMENT", 20 * 1024 * 1024L // 20MB
    );
    
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
        "image/jpeg", "image/png", "image/gif", "image/webp"
    );
    
    private static final Set<String> ALLOWED_DOCUMENT_TYPES = Set.of(
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    
    @Transactional
    public FileUploadResult uploadFile(MultipartFile file, FileUploadRequest request) {
        UUID tenantId = SecurityContextHolder.getCurrentTenantId();
        UUID userId = SecurityContextHolder.getCurrentUserId();
        
        // 1. 파일 검증
        validationService.validate(file, request.getCategory());
        
        // 2. 파일 크기 검증
        Long maxSize = MAX_FILE_SIZES.getOrDefault(request.getCategory(), 10 * 1024 * 1024L);
        if (file.getSize() > maxSize) {
            throw new FileSizeExceededException(
                String.format("파일 크기가 제한을 초과했습니다. (최대: %dMB)", maxSize / 1024 / 1024));
        }
        
        // 3. 파일 유형 검증
        String contentType = file.getContentType();
        validateContentType(contentType, request.getCategory());
        
        // 4. 저장 경로 생성
        String extension = getFileExtension(file.getOriginalFilename());
        String storedName = UUID.randomUUID().toString() + "." + extension;
        String s3Key = buildS3Key(tenantId, request.getCategory(), storedName);
        
        // 5. 체크섬 계산
        String checksum = calculateChecksum(file);
        
        // 6. S3 업로드
        try {
            PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(s3Bucket)
                .key(s3Key)
                .contentType(contentType)
                .contentLength(file.getSize())
                .serverSideEncryption(ServerSideEncryption.AES256)
                .metadata(Map.of(
                    "tenant-id", tenantId.toString(),
                    "original-name", file.getOriginalFilename(),
                    "uploaded-by", userId.toString()
                ))
                .build();
            
            s3Client.putObject(putRequest, 
                RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
                
        } catch (Exception e) {
            throw new FileUploadException("파일 업로드에 실패했습니다.", e);
        }
        
        // 7. 메타데이터 저장
        FileMetadata metadata = FileMetadata.builder()
            .tenantId(tenantId)
            .originalName(file.getOriginalFilename())
            .storedName(storedName)
            .s3Key(s3Key)
            .s3Bucket(s3Bucket)
            .contentType(contentType)
            .fileSize(file.getSize())
            .fileExtension(extension)
            .category(request.getCategory())
            .entityType(request.getEntityType())
            .entityId(request.getEntityId())
            .checksum(checksum)
            .isPublic(request.getIsPublic() != null ? request.getIsPublic() : false)
            .virusScanStatus(VirusScanStatus.PENDING)
            .createdBy(userId)
            .build();
        
        metadata = metadataRepository.save(metadata);
        
        // 8. 이미지인 경우 썸네일 생성
        if (isImage(contentType)) {
            imageService.generateThumbnailsAsync(metadata.getId(), file);
        }
        
        // 9. 바이러스 스캔 요청 (비동기)
        // virusScanService.requestScanAsync(metadata.getId(), s3Key);
        
        // 10. 다운로드 URL 생성
        String downloadUrl = generatePresignedUrl(s3Key, Duration.ofHours(1));
        
        return FileUploadResult.builder()
            .id(metadata.getId())
            .originalName(metadata.getOriginalName())
            .storedName(metadata.getStoredName())
            .contentType(metadata.getContentType())
            .fileSize(metadata.getFileSize())
            .category(metadata.getCategory())
            .downloadUrl(downloadUrl)
            .createdAt(metadata.getCreatedAt())
            .build();
    }
    
    private String buildS3Key(UUID tenantId, String category, String storedName) {
        String path = switch (category) {
            case "EMPLOYEE_PHOTO" -> "employees/photos";
            case "EMPLOYEE_DOCUMENT" -> "employees/documents";
            case "LEAVE_ATTACHMENT" -> "leaves/attachments";
            case "APPROVAL_ATTACHMENT" -> "approvals/attachments";
            case "ANNOUNCEMENT" -> "announcements/attachments";
            default -> "others";
        };
        
        return String.format("%s/%s/%s", tenantId, path, storedName);
    }
    
    private void validateContentType(String contentType, String category) {
        Set<String> allowedTypes = switch (category) {
            case "EMPLOYEE_PHOTO" -> ALLOWED_IMAGE_TYPES;
            case "EMPLOYEE_DOCUMENT", "LEAVE_ATTACHMENT", "APPROVAL_ATTACHMENT" -> {
                Set<String> combined = new HashSet<>(ALLOWED_DOCUMENT_TYPES);
                combined.addAll(ALLOWED_IMAGE_TYPES);
                yield combined;
            }
            default -> Set.of(); // 모든 타입 허용
        };
        
        if (!allowedTypes.isEmpty() && !allowedTypes.contains(contentType)) {
            throw new InvalidFileTypeException(
                "허용되지 않는 파일 형식입니다: " + contentType);
        }
    }
    
    private String calculateChecksum(MultipartFile file) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(file.getBytes());
            return bytesToHex(hash);
        } catch (Exception e) {
            return null;
        }
    }
}
```

### 5.2 Presigned URL 생성

```java
@Service
@RequiredArgsConstructor
public class FileDownloadService {
    
    private final FileMetadataRepository metadataRepository;
    private final FileAccessLogRepository accessLogRepository;
    private final S3Presigner s3Presigner;
    
    private static final Duration DEFAULT_URL_EXPIRATION = Duration.ofHours(1);
    
    public FileDownloadResult getDownloadUrl(UUID fileId) {
        UUID tenantId = SecurityContextHolder.getCurrentTenantId();
        UUID userId = SecurityContextHolder.getCurrentUserId();
        
        FileMetadata metadata = metadataRepository.findById(fileId)
            .orElseThrow(() -> new NotFoundException("파일을 찾을 수 없습니다."));
        
        // 테넌트 격리 검증
        if (!metadata.getIsPublic() && !metadata.getTenantId().equals(tenantId)) {
            throw new ForbiddenException("파일에 접근할 권한이 없습니다.");
        }
        
        // Presigned URL 생성
        GetObjectRequest getRequest = GetObjectRequest.builder()
            .bucket(metadata.getS3Bucket())
            .key(metadata.getS3Key())
            .responseContentDisposition(
                "attachment; filename=\"" + metadata.getOriginalName() + "\"")
            .build();
        
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
            .signatureDuration(DEFAULT_URL_EXPIRATION)
            .getObjectRequest(getRequest)
            .build();
        
        PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
        
        // 접근 로그 저장
        saveAccessLog(fileId, tenantId, userId, AccessType.DOWNLOAD);
        
        return FileDownloadResult.builder()
            .downloadUrl(presignedRequest.url().toString())
            .fileName(metadata.getOriginalName())
            .contentType(metadata.getContentType())
            .fileSize(metadata.getFileSize())
            .expiresAt(LocalDateTime.now().plus(DEFAULT_URL_EXPIRATION))
            .build();
    }
    
    public String generatePresignedUploadUrl(PresignedUploadRequest request) {
        UUID tenantId = SecurityContextHolder.getCurrentTenantId();
        UUID userId = SecurityContextHolder.getCurrentUserId();
        
        // 임시 파일 메타데이터 생성
        String storedName = UUID.randomUUID().toString() + "." + 
            getFileExtension(request.getFileName());
        String s3Key = buildS3Key(tenantId, request.getCategory(), storedName);
        
        FileMetadata metadata = FileMetadata.builder()
            .tenantId(tenantId)
            .originalName(request.getFileName())
            .storedName(storedName)
            .s3Key(s3Key)
            .s3Bucket(s3Bucket)
            .contentType(request.getContentType())
            .fileSize(request.getFileSize())
            .category(request.getCategory())
            .virusScanStatus(VirusScanStatus.PENDING)
            .createdBy(userId)
            .build();
        
        metadata = metadataRepository.save(metadata);
        
        // Presigned Upload URL 생성
        PutObjectRequest putRequest = PutObjectRequest.builder()
            .bucket(s3Bucket)
            .key(s3Key)
            .contentType(request.getContentType())
            .contentLength(request.getFileSize())
            .build();
        
        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
            .signatureDuration(Duration.ofMinutes(30))
            .putObjectRequest(putRequest)
            .build();
        
        PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);
        
        return presignedRequest.url().toString();
    }
    
    private void saveAccessLog(UUID fileId, UUID tenantId, UUID userId, AccessType type) {
        FileAccessLog log = FileAccessLog.builder()
            .fileId(fileId)
            .tenantId(tenantId)
            .accessedBy(userId)
            .accessType(type)
            .ipAddress(SecurityContextHolder.getClientIp())
            .userAgent(SecurityContextHolder.getUserAgent())
            .build();
        
        accessLogRepository.save(log);
    }
}
```

### 5.3 이미지 처리

```java
@Service
@RequiredArgsConstructor
public class ImageProcessingService {
    
    private final FileMetadataRepository metadataRepository;
    private final FileThumbnailRepository thumbnailRepository;
    private final S3Client s3Client;
    
    private static final Map<String, int[]> THUMBNAIL_SIZES = Map.of(
        "SMALL", new int[]{100, 100},
        "MEDIUM", new int[]{300, 300},
        "LARGE", new int[]{800, 800}
    );
    
    @Async
    public void generateThumbnailsAsync(UUID fileId, MultipartFile originalFile) {
        try {
            generateThumbnails(fileId, originalFile);
        } catch (Exception e) {
            log.error("썸네일 생성 실패 - fileId: {}", fileId, e);
        }
    }
    
    public void generateThumbnails(UUID fileId, MultipartFile originalFile) throws Exception {
        FileMetadata metadata = metadataRepository.findById(fileId).orElseThrow();
        
        BufferedImage originalImage = ImageIO.read(originalFile.getInputStream());
        
        for (Map.Entry<String, int[]> entry : THUMBNAIL_SIZES.entrySet()) {
            String sizeType = entry.getKey();
            int[] dimensions = entry.getValue();
            
            BufferedImage thumbnail = resizeImage(originalImage, dimensions[0], dimensions[1]);
            
            // 썸네일 S3 업로드
            String thumbnailKey = buildThumbnailKey(metadata.getS3Key(), sizeType);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(thumbnail, "jpg", baos);
            byte[] thumbnailBytes = baos.toByteArray();
            
            PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(metadata.getS3Bucket())
                .key(thumbnailKey)
                .contentType("image/jpeg")
                .contentLength((long) thumbnailBytes.length)
                .build();
            
            s3Client.putObject(putRequest, RequestBody.fromBytes(thumbnailBytes));
            
            // 썸네일 메타데이터 저장
            FileThumbnail thumbnailMeta = FileThumbnail.builder()
                .fileId(fileId)
                .sizeType(sizeType)
                .s3Key(thumbnailKey)
                .width(thumbnail.getWidth())
                .height(thumbnail.getHeight())
                .fileSize(thumbnailBytes.length)
                .build();
            
            thumbnailRepository.save(thumbnailMeta);
        }
    }
    
    private BufferedImage resizeImage(BufferedImage original, int maxWidth, int maxHeight) {
        int originalWidth = original.getWidth();
        int originalHeight = original.getHeight();
        
        // 비율 유지하면서 리사이징
        double ratio = Math.min(
            (double) maxWidth / originalWidth,
            (double) maxHeight / originalHeight
        );
        
        int newWidth = (int) (originalWidth * ratio);
        int newHeight = (int) (originalHeight * ratio);
        
        BufferedImage resized = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = resized.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, 
            RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(original, 0, 0, newWidth, newHeight, null);
        g.dispose();
        
        return resized;
    }
    
    private String buildThumbnailKey(String originalKey, String sizeType) {
        int lastDot = originalKey.lastIndexOf('.');
        String baseName = originalKey.substring(0, lastDot);
        return baseName + "_thumb_" + sizeType.toLowerCase() + ".jpg";
    }
}
```

### 5.4 파일 정리 (Retention)

```java
@Service
@RequiredArgsConstructor
public class FileRetentionService {
    
    private final FileMetadataRepository metadataRepository;
    private final S3Client s3Client;
    
    /**
     * 만료된 파일 정리 (매일 새벽 3시)
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupExpiredFiles() {
        LocalDate today = LocalDate.now();
        
        List<FileMetadata> expiredFiles = metadataRepository
            .findByRetentionUntilBeforeAndIsDeletedFalse(today);
        
        log.info("만료 파일 정리 시작 - 대상: {}건", expiredFiles.size());
        
        for (FileMetadata file : expiredFiles) {
            try {
                // S3에서 삭제
                deleteFromS3(file.getS3Bucket(), file.getS3Key());
                
                // 썸네일도 삭제
                deleteThumbnails(file);
                
                // 소프트 삭제 처리
                file.setIsDeleted(true);
                file.setDeletedAt(LocalDateTime.now());
                metadataRepository.save(file);
                
                log.info("파일 삭제 완료 - fileId: {}", file.getId());
                
            } catch (Exception e) {
                log.error("파일 삭제 실패 - fileId: {}", file.getId(), e);
            }
        }
    }
    
    /**
     * 임시 파일 정리 (확인되지 않은 Presigned 업로드)
     */
    @Scheduled(cron = "0 0 4 * * *")
    @Transactional
    public void cleanupOrphanedFiles() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(1);
        
        // 24시간 이상 확인되지 않은 임시 파일 조회
        List<FileMetadata> orphanedFiles = metadataRepository
            .findUnconfirmedFilesBefore(threshold);
        
        for (FileMetadata file : orphanedFiles) {
            try {
                deleteFromS3(file.getS3Bucket(), file.getS3Key());
                metadataRepository.delete(file);
            } catch (Exception e) {
                log.error("임시 파일 삭제 실패 - fileId: {}", file.getId(), e);
            }
        }
    }
    
    private void deleteFromS3(String bucket, String key) {
        DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
            .bucket(bucket)
            .key(key)
            .build();
        
        s3Client.deleteObject(deleteRequest);
    }
}
```

---

## 6. 이벤트

### 6.1 발행 이벤트

| 이벤트 | 토픽 | 설명 |
|--------|------|------|
| FileUploadedEvent | hr-saas.file.uploaded | 파일 업로드 완료 |
| FileDeletedEvent | hr-saas.file.deleted | 파일 삭제 |
| VirusScanCompletedEvent | hr-saas.file.virus-scanned | 바이러스 스캔 완료 |

### 6.2 구독 이벤트

| 이벤트 | 토픽 | 처리 내용 |
|--------|------|----------|
| EmployeeDeletedEvent | hr-saas.employee.deleted | 퇴직자 파일 보존 기간 설정 |

---

## 7. 보안

### 7.1 권한 매트릭스

| API | 관리자 | 파일 소유자 | 같은 테넌트 | 외부 |
|-----|--------|------------|------------|------|
| 파일 업로드 | ✅ | ✅ | ✅ | ❌ |
| 파일 다운로드 | ✅ | ✅ | ✅ (공개 파일) | ❌ |
| 파일 삭제 | ✅ | ✅ | ❌ | ❌ |
| 스토리지 사용량 | ✅ | ❌ | ❌ | ❌ |

### 7.2 보안 설정

```java
@Configuration
public class S3SecurityConfig {
    
    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
            .region(Region.AP_NORTHEAST_2)
            .credentialsProvider(DefaultCredentialsProvider.create())
            .build();
    }
}

// S3 버킷 정책 (server-side encryption 필수)
// 모든 객체는 AES-256 암호화
```

---

## 8. 성능 최적화

### 8.1 캐싱 전략

| 데이터 | 캐시 TTL | 무효화 조건 |
|--------|---------|------------|
| 파일 메타데이터 | 30분 | 파일 수정/삭제 시 |
| Presigned URL | URL 만료 시간 | - |
| 썸네일 URL | 1시간 | - |

### 8.2 대용량 파일 처리

```java
// Multipart Upload for large files (> 100MB)
@Service
public class MultipartUploadService {
    
    private static final long PART_SIZE = 10 * 1024 * 1024; // 10MB
    
    public void uploadLargeFile(InputStream inputStream, String s3Key, long fileSize) {
        CreateMultipartUploadRequest createRequest = CreateMultipartUploadRequest.builder()
            .bucket(s3Bucket)
            .key(s3Key)
            .build();
        
        CreateMultipartUploadResponse createResponse = s3Client.createMultipartUpload(createRequest);
        String uploadId = createResponse.uploadId();
        
        List<CompletedPart> completedParts = new ArrayList<>();
        int partNumber = 1;
        
        try {
            byte[] buffer = new byte[(int) PART_SIZE];
            int bytesRead;
            
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                UploadPartRequest uploadPartRequest = UploadPartRequest.builder()
                    .bucket(s3Bucket)
                    .key(s3Key)
                    .uploadId(uploadId)
                    .partNumber(partNumber)
                    .build();
                
                UploadPartResponse uploadPartResponse = s3Client.uploadPart(
                    uploadPartRequest,
                    RequestBody.fromBytes(Arrays.copyOf(buffer, bytesRead))
                );
                
                completedParts.add(CompletedPart.builder()
                    .partNumber(partNumber)
                    .eTag(uploadPartResponse.eTag())
                    .build());
                
                partNumber++;
            }
            
            // Complete multipart upload
            CompleteMultipartUploadRequest completeRequest = CompleteMultipartUploadRequest.builder()
                .bucket(s3Bucket)
                .key(s3Key)
                .uploadId(uploadId)
                .multipartUpload(CompletedMultipartUpload.builder()
                    .parts(completedParts)
                    .build())
                .build();
            
            s3Client.completeMultipartUpload(completeRequest);
            
        } catch (Exception e) {
            // Abort on failure
            s3Client.abortMultipartUpload(AbortMultipartUploadRequest.builder()
                .bucket(s3Bucket)
                .key(s3Key)
                .uploadId(uploadId)
                .build());
            throw new FileUploadException("대용량 파일 업로드 실패", e);
        }
    }
}
```

---

## 9. 모니터링

### 9.1 메트릭

```yaml
# Prometheus 메트릭
- name: file_upload_total
  type: counter
  labels: [tenant_id, category, status]
  description: 파일 업로드 수

- name: file_upload_size_bytes
  type: histogram
  labels: [category]
  description: 업로드 파일 크기

- name: file_download_total
  type: counter
  labels: [tenant_id]
  description: 파일 다운로드 수

- name: storage_usage_bytes
  type: gauge
  labels: [tenant_id]
  description: 테넌트별 스토리지 사용량
```

### 9.2 알림 규칙

```yaml
# Grafana Alert Rules
- alert: StorageUsageHigh
  expr: storage_usage_bytes / storage_limit_bytes > 0.9
  for: 1h
  labels:
    severity: warning
  annotations:
    summary: "스토리지 사용량이 90%를 초과했습니다."

- alert: FileUploadErrors
  expr: rate(file_upload_total{status="error"}[5m]) > 0.1
  labels:
    severity: critical
  annotations:
    summary: "파일 업로드 오류가 증가하고 있습니다."
```

---

## 10. 배포 설정

### 10.1 Kubernetes 매니페스트

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: file-service
  namespace: hr-saas
spec:
  replicas: 2
  selector:
    matchLabels:
      app: file-service
  template:
    metadata:
      labels:
        app: file-service
    spec:
      serviceAccountName: file-service-sa
      containers:
        - name: file-service
          image: hr-saas/file-service:latest
          ports:
            - containerPort: 8080
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: "prod"
            - name: AWS_S3_BUCKET
              valueFrom:
                configMapKeyRef:
                  name: file-service-config
                  key: s3-bucket
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 30
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: file-service
  namespace: hr-saas
spec:
  selector:
    app: file-service
  ports:
    - port: 8080
  type: ClusterIP
---
# IAM Role for S3 access (IRSA)
apiVersion: v1
kind: ServiceAccount
metadata:
  name: file-service-sa
  namespace: hr-saas
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT_ID:role/file-service-s3-role
```

### 10.2 S3 버킷 설정

```yaml
# Terraform or CloudFormation
S3Bucket:
  BucketName: hr-saas-files-prod
  VersioningEnabled: true
  EncryptionConfiguration:
    SSEAlgorithm: AES256
  LifecycleRules:
    - Id: DeleteOldVersions
      Status: Enabled
      NoncurrentVersionExpiration:
        NoncurrentDays: 90
    - Id: TransitionToGlacier
      Status: Enabled
      Transitions:
        - StorageClass: GLACIER
          TransitionInDays: 365
      Prefix: archive/
  CorsConfiguration:
    CORSRules:
      - AllowedHeaders: ["*"]
        AllowedMethods: ["GET", "PUT", "POST"]
        AllowedOrigins: ["https://*.hr-saas.com"]
        MaxAgeSeconds: 3000
```

---

## 11. 바이러스 스캔 (준비)

### 11.1 구조 (미구현, 추후 추가 가능)

```java
// 바이러스 스캔 인터페이스 (추후 구현)
public interface VirusScanService {
    
    void requestScanAsync(UUID fileId, String s3Key);
    
    VirusScanResult getScanResult(UUID fileId);
}

// AWS Lambda + ClamAV 연동 예정
// S3 이벤트 트리거 → Lambda 실행 → ClamAV 스캔 → 결과 저장
```

---

## 12. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2024-01-15 | - | 최초 작성 |