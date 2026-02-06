> **DEPRECATED**: 이 문서는 초기 설계 문서입니다. common-event 섹션의 Kafka 관련 내용은
> 현재 구현(SQS/SNS)과 다릅니다. 각 모듈 최신 분석은 [`docs/modules/`](modules/)를 참조하세요.

# Common Modules - Software Design Document (SDD)

**Document Version**: 1.0
**Created**: 2025-02-03

---

## Table of Contents

1. [Overview](#1-overview)
2. [Module Dependency Graph](#2-module-dependency-graph)
3. [common-core](#3-common-core)
4. [common-entity](#4-common-entity)
5. [common-response](#5-common-response)
6. [common-database](#6-common-database)
7. [common-tenant](#7-common-tenant)
8. [common-security](#8-common-security)
9. [common-privacy](#9-common-privacy)
10. [common-cache](#10-common-cache)
11. [common-event](#11-common-event)

---

## 1. Overview

### 1.1 Purpose

The common modules provide shared functionality across all microservices in the HR SaaS platform. They ensure consistency, reduce code duplication, and enforce architectural patterns.

### 1.2 Module Summary

| Module | Purpose | Dependencies |
|--------|---------|--------------|
| common-core | Base exceptions, error codes, utilities | None |
| common-entity | JPA base entities, auditing | common-core |
| common-response | API response wrappers, exception handling | common-core |
| common-database | RLS, Flyway, connection pooling | common-entity |
| common-tenant | Multi-tenancy context, filters | common-core |
| common-security | JWT, permissions, role hierarchy | common-core, common-tenant |
| common-privacy | Masking, encryption | common-core |
| common-cache | Redis caching strategies | common-core, common-tenant |
| common-event | Kafka event publishing | common-core |

---

## 2. Module Dependency Graph

```
common-core (Base)
    │
    ├── common-entity ─────┬── common-response
    │                      │
    │                      └── common-database
    │
    ├── common-tenant
    │       │
    │       └── common-security
    │
    ├── common-privacy
    │
    ├── common-cache (depends on common-tenant)
    │
    └── common-event
```

---

## 3. common-core

### 3.1 Purpose

Provides foundational classes used by all other modules: exceptions, error codes, constants, and utility classes.

### 3.2 Package Structure

```
com.hrsaas.common.core/
├── exception/
│   ├── BusinessException.java
│   ├── NotFoundException.java
│   ├── DuplicateException.java
│   ├── ForbiddenException.java
│   ├── ValidationException.java
│   └── ExternalServiceException.java
├── error/
│   ├── ErrorCode.java
│   └── ErrorCodeRegistry.java
├── constant/
│   ├── HeaderConstants.java
│   └── DateConstants.java
└── util/
    ├── DateTimeUtils.java
    ├── StringUtils.java
    ├── JsonUtils.java
    └── ValidationUtils.java
```

### 3.3 Exception Hierarchy

```java
/**
 * Base exception for all business exceptions.
 */
public class BusinessException extends RuntimeException {

    private final String errorCode;
    private final Object[] args;
    private final HttpStatus httpStatus;

    public BusinessException(String errorCode, String message) {
        this(errorCode, message, HttpStatus.BAD_REQUEST);
    }

    public BusinessException(String errorCode, String message, HttpStatus httpStatus) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
        this.args = new Object[0];
    }

    public BusinessException(String errorCode, String message, HttpStatus httpStatus, Object... args) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
        this.args = args;
    }

    public String getErrorCode() { return errorCode; }
    public HttpStatus getHttpStatus() { return httpStatus; }
    public Object[] getArgs() { return args; }
}

/**
 * Exception for resource not found scenarios.
 */
public class NotFoundException extends BusinessException {

    public NotFoundException(String message) {
        super("NOT_FOUND", message, HttpStatus.NOT_FOUND);
    }

    public NotFoundException(String resourceType, Object id) {
        super("NOT_FOUND",
              String.format("%s not found with id: %s", resourceType, id),
              HttpStatus.NOT_FOUND);
    }
}

/**
 * Exception for duplicate resource scenarios.
 */
public class DuplicateException extends BusinessException {

    public DuplicateException(String message) {
        super("DUPLICATE", message, HttpStatus.CONFLICT);
    }

    public DuplicateException(String field, Object value) {
        super("DUPLICATE",
              String.format("Resource already exists with %s: %s", field, value),
              HttpStatus.CONFLICT);
    }
}

/**
 * Exception for forbidden access.
 */
public class ForbiddenException extends BusinessException {

    public ForbiddenException(String message) {
        super("FORBIDDEN", message, HttpStatus.FORBIDDEN);
    }
}

/**
 * Exception for validation failures.
 */
public class ValidationException extends BusinessException {

    private final Map<String, List<String>> fieldErrors;

    public ValidationException(String message) {
        super("VALIDATION_ERROR", message, HttpStatus.BAD_REQUEST);
        this.fieldErrors = Collections.emptyMap();
    }

    public ValidationException(Map<String, List<String>> fieldErrors) {
        super("VALIDATION_ERROR", "Validation failed", HttpStatus.BAD_REQUEST);
        this.fieldErrors = fieldErrors;
    }

    public Map<String, List<String>> getFieldErrors() { return fieldErrors; }
}

/**
 * Exception for external service failures.
 */
public class ExternalServiceException extends BusinessException {

    private final String serviceName;

    public ExternalServiceException(String serviceName, String message) {
        super("EXTERNAL_SERVICE_ERROR", message, HttpStatus.SERVICE_UNAVAILABLE);
        this.serviceName = serviceName;
    }

    public String getServiceName() { return serviceName; }
}
```

### 3.4 Error Code Registry

```java
/**
 * Centralized error code definitions.
 */
public interface ErrorCode {

    // Common errors (CMN_XXX)
    String CMN_001 = "CMN_001"; // Internal server error
    String CMN_002 = "CMN_002"; // Invalid request format
    String CMN_003 = "CMN_003"; // Resource not found
    String CMN_004 = "CMN_004"; // Duplicate resource
    String CMN_005 = "CMN_005"; // Validation failed

    // Authentication errors (AUTH_XXX)
    String AUTH_001 = "AUTH_001"; // Invalid credentials
    String AUTH_002 = "AUTH_002"; // Token expired
    String AUTH_003 = "AUTH_003"; // Token invalid
    String AUTH_004 = "AUTH_004"; // Insufficient permissions
    String AUTH_005 = "AUTH_005"; // Session expired

    // Tenant errors (TNT_XXX)
    String TNT_001 = "TNT_001"; // Tenant not found
    String TNT_002 = "TNT_002"; // Tenant inactive
    String TNT_003 = "TNT_003"; // Tenant access denied
    String TNT_004 = "TNT_004"; // Duplicate tenant code

    // Employee errors (EMP_XXX)
    String EMP_001 = "EMP_001"; // Employee not found
    String EMP_002 = "EMP_002"; // Duplicate employee number
    String EMP_003 = "EMP_003"; // Duplicate email
    String EMP_004 = "EMP_004"; // Invalid employee status

    // Organization errors (ORG_XXX)
    String ORG_001 = "ORG_001"; // Department not found
    String ORG_002 = "ORG_002"; // Invalid hierarchy
    String ORG_003 = "ORG_003"; // Circular reference detected

    // Approval errors (APR_XXX)
    String APR_001 = "APR_001"; // Approval not found
    String APR_002 = "APR_002"; // Invalid state transition
    String APR_003 = "APR_003"; // Not authorized to approve
    String APR_004 = "APR_004"; // Already processed

    // Attendance errors (ATT_XXX)
    String ATT_001 = "ATT_001"; // Leave request not found
    String ATT_002 = "ATT_002"; // Insufficient leave balance
    String ATT_003 = "ATT_003"; // Overlapping leave period

    // MDM errors (MDM_XXX)
    String MDM_001 = "MDM_001"; // Code group not found
    String MDM_002 = "MDM_002"; // Code not found
    String MDM_003 = "MDM_003"; // Duplicate code

    // File errors (FILE_XXX)
    String FILE_001 = "FILE_001"; // File not found
    String FILE_002 = "FILE_002"; // File too large
    String FILE_003 = "FILE_003"; // Invalid file type
    String FILE_004 = "FILE_004"; // Upload failed
}
```

### 3.5 Utility Classes

```java
/**
 * Date/Time utility methods.
 */
@UtilityClass
public class DateTimeUtils {

    public static final ZoneId KST = ZoneId.of("Asia/Seoul");
    public static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    public static final DateTimeFormatter DATETIME_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static LocalDate today() {
        return LocalDate.now(KST);
    }

    public static LocalDateTime now() {
        return LocalDateTime.now(KST);
    }

    public static Instant nowInstant() {
        return Instant.now();
    }

    public static LocalDate parseDate(String dateStr) {
        if (StringUtils.isBlank(dateStr)) return null;
        return LocalDate.parse(dateStr, DATE_FORMAT);
    }

    public static LocalDateTime parseDateTime(String dateTimeStr) {
        if (StringUtils.isBlank(dateTimeStr)) return null;
        return LocalDateTime.parse(dateTimeStr, DATETIME_FORMAT);
    }

    public static String formatDate(LocalDate date) {
        if (date == null) return null;
        return date.format(DATE_FORMAT);
    }

    public static String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return null;
        return dateTime.format(DATETIME_FORMAT);
    }

    public static long daysBetween(LocalDate start, LocalDate end) {
        return ChronoUnit.DAYS.between(start, end);
    }

    public static boolean isWeekend(LocalDate date) {
        DayOfWeek dow = date.getDayOfWeek();
        return dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY;
    }

    public static long countWorkingDays(LocalDate start, LocalDate end) {
        return start.datesUntil(end.plusDays(1))
            .filter(date -> !isWeekend(date))
            .count();
    }
}

/**
 * JSON utility methods using Jackson.
 */
@UtilityClass
public class JsonUtils {

    private static final ObjectMapper objectMapper = createObjectMapper();

    private static ObjectMapper createObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        return mapper;
    }

    public static String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON serialization failed", e);
        }
    }

    public static <T> T fromJson(String json, Class<T> clazz) {
        try {
            return objectMapper.readValue(json, clazz);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON deserialization failed", e);
        }
    }

    public static <T> T fromJson(String json, TypeReference<T> typeRef) {
        try {
            return objectMapper.readValue(json, typeRef);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON deserialization failed", e);
        }
    }

    public static JsonNode toJsonNode(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON parsing failed", e);
        }
    }
}
```

### 3.6 Constants

```java
/**
 * HTTP header constants.
 */
public interface HeaderConstants {

    String X_TENANT_ID = "X-Tenant-ID";
    String X_USER_ID = "X-User-ID";
    String X_USER_ROLES = "X-User-Roles";
    String X_REQUEST_ID = "X-Request-ID";
    String X_EMPLOYEE_ID = "X-Employee-ID";
    String X_API_VERSION = "X-API-Version";
    String X_CORRELATION_ID = "X-Correlation-ID";
}
```

### 3.7 Gradle Dependencies

```gradle
// common-core/build.gradle
plugins {
    id 'java-library'
}

dependencies {
    api 'org.springframework:spring-web'
    api 'com.fasterxml.jackson.core:jackson-databind'
    api 'com.fasterxml.jackson.datatype:jackson-datatype-jsr310'

    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'

    testImplementation 'org.junit.jupiter:junit-jupiter'
    testImplementation 'org.assertj:assertj-core'
}
```

---

## 4. common-entity

### 4.1 Purpose

Provides JPA base entity classes with auditing support and tenant awareness.

### 4.2 Package Structure

```
com.hrsaas.common.entity/
├── BaseEntity.java
├── AuditableEntity.java
├── TenantAwareEntity.java
├── SoftDeleteEntity.java
├── converter/
│   ├── JsonNodeConverter.java
│   └── StringListConverter.java
└── config/
    └── JpaAuditingConfig.java
```

### 4.3 Base Entities

```java
/**
 * Base entity with UUID primary key.
 */
@MappedSuperclass
@Getter
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        BaseEntity that = (BaseEntity) o;
        return id != null && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}

/**
 * Entity with audit fields (created/updated timestamps and actors).
 */
@MappedSuperclass
@Getter
@Setter
@EntityListeners(AuditingEntityListener.class)
public abstract class AuditableEntity extends BaseEntity {

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private UUID createdBy;

    @LastModifiedBy
    @Column(name = "updated_by")
    private UUID updatedBy;
}

/**
 * Entity with tenant isolation support.
 */
@MappedSuperclass
@Getter
@Setter
public abstract class TenantAwareEntity extends AuditableEntity {

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @PrePersist
    protected void prePersist() {
        if (this.tenantId == null) {
            this.tenantId = TenantContext.getCurrentTenant();
        }
        if (this.tenantId == null) {
            throw new IllegalStateException("Tenant ID must be set before persisting");
        }
    }
}

/**
 * Entity with soft delete support.
 */
@MappedSuperclass
@Getter
@Setter
@SQLRestriction("deleted_at IS NULL")
public abstract class SoftDeleteEntity extends TenantAwareEntity {

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "deleted_by")
    private UUID deletedBy;

    public boolean isDeleted() {
        return deletedAt != null;
    }

    public void softDelete() {
        this.deletedAt = Instant.now();
        this.deletedBy = SecurityContextHolder.getCurrentUserId();
    }
}
```

### 4.4 JPA Auditing Configuration

```java
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class JpaAuditingConfig {

    @Bean
    public AuditorAware<UUID> auditorProvider() {
        return () -> Optional.ofNullable(SecurityContextHolder.getCurrentUserId());
    }
}
```

### 4.5 Type Converters

```java
/**
 * Converts JsonNode to JSONB column.
 */
@Converter
public class JsonNodeConverter implements AttributeConverter<JsonNode, String> {

    private static final ObjectMapper mapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(JsonNode node) {
        if (node == null) return null;
        try {
            return mapper.writeValueAsString(node);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to convert JsonNode to String", e);
        }
    }

    @Override
    public JsonNode convertToEntityAttribute(String json) {
        if (json == null) return null;
        try {
            return mapper.readTree(json);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to convert String to JsonNode", e);
        }
    }
}

/**
 * Converts List<String> to TEXT[] column.
 */
@Converter
public class StringListConverter implements AttributeConverter<List<String>, String[]> {

    @Override
    public String[] convertToDatabaseColumn(List<String> list) {
        if (list == null) return null;
        return list.toArray(new String[0]);
    }

    @Override
    public List<String> convertToEntityAttribute(String[] array) {
        if (array == null) return null;
        return Arrays.asList(array);
    }
}
```

### 4.6 Gradle Dependencies

```gradle
// common-entity/build.gradle
plugins {
    id 'java-library'
}

dependencies {
    api project(':common:common-core')

    api 'org.springframework.boot:spring-boot-starter-data-jpa'
    api 'org.hibernate.orm:hibernate-core'

    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
}
```

---

## 5. common-response

### 5.1 Purpose

Standardizes API responses and provides global exception handling.

### 5.2 Package Structure

```
com.hrsaas.common.response/
├── ApiResponse.java
├── PageResponse.java
├── ErrorResponse.java
├── handler/
│   └── GlobalExceptionHandler.java
└── advice/
    └── ResponseBodyAdvice.java
```

### 5.3 Response DTOs

```java
/**
 * Standard API response wrapper.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

    private boolean success;
    private T data;
    private String message;
    private String code;
    private Instant timestamp;

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .data(data)
            .timestamp(Instant.now())
            .build();
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
            .success(true)
            .data(data)
            .message(message)
            .timestamp(Instant.now())
            .build();
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return ApiResponse.<T>builder()
            .success(false)
            .code(code)
            .message(message)
            .timestamp(Instant.now())
            .build();
    }
}

/**
 * Paginated response wrapper.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {

    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean first;
    private boolean last;

    public static <T> PageResponse<T> from(Page<T> page) {
        return PageResponse.<T>builder()
            .content(page.getContent())
            .page(page.getNumber())
            .size(page.getSize())
            .totalElements(page.getTotalElements())
            .totalPages(page.getTotalPages())
            .first(page.isFirst())
            .last(page.isLast())
            .build();
    }

    public static <T, S> PageResponse<T> from(Page<S> page, Function<S, T> mapper) {
        List<T> content = page.getContent().stream()
            .map(mapper)
            .collect(Collectors.toList());

        return PageResponse.<T>builder()
            .content(content)
            .page(page.getNumber())
            .size(page.getSize())
            .totalElements(page.getTotalElements())
            .totalPages(page.getTotalPages())
            .first(page.isFirst())
            .last(page.isLast())
            .build();
    }
}

/**
 * Error response with details.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {

    private String code;
    private String message;
    private String path;
    private String requestId;
    private Instant timestamp;
    private Map<String, List<String>> fieldErrors;

    public static ErrorResponse of(String code, String message, String path, String requestId) {
        return ErrorResponse.builder()
            .code(code)
            .message(message)
            .path(path)
            .requestId(requestId)
            .timestamp(Instant.now())
            .build();
    }
}
```

### 5.4 Global Exception Handler

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Handle BusinessException.
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(
            BusinessException ex, HttpServletRequest request) {

        log.warn("Business exception: {} - {}", ex.getErrorCode(), ex.getMessage());

        ApiResponse<Void> response = ApiResponse.error(ex.getErrorCode(), ex.getMessage());
        return new ResponseEntity<>(response, ex.getHttpStatus());
    }

    /**
     * Handle NotFoundException.
     */
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFoundException(
            NotFoundException ex, HttpServletRequest request) {

        log.warn("Resource not found: {}", ex.getMessage());

        ApiResponse<Void> response = ApiResponse.error(ex.getErrorCode(), ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    /**
     * Handle ValidationException.
     */
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            ValidationException ex, HttpServletRequest request) {

        log.warn("Validation failed: {}", ex.getFieldErrors());

        ErrorResponse response = ErrorResponse.builder()
            .code(ex.getErrorCode())
            .message(ex.getMessage())
            .path(request.getRequestURI())
            .requestId(request.getHeader(HeaderConstants.X_REQUEST_ID))
            .timestamp(Instant.now())
            .fieldErrors(ex.getFieldErrors())
            .build();

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle Spring validation errors.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        Map<String, List<String>> fieldErrors = ex.getBindingResult().getFieldErrors()
            .stream()
            .collect(Collectors.groupingBy(
                FieldError::getField,
                Collectors.mapping(FieldError::getDefaultMessage, Collectors.toList())
            ));

        ErrorResponse response = ErrorResponse.builder()
            .code(ErrorCode.CMN_005)
            .message("Validation failed")
            .path(request.getRequestURI())
            .requestId(request.getHeader(HeaderConstants.X_REQUEST_ID))
            .timestamp(Instant.now())
            .fieldErrors(fieldErrors)
            .build();

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle constraint violations.
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex, HttpServletRequest request) {

        Map<String, List<String>> fieldErrors = ex.getConstraintViolations()
            .stream()
            .collect(Collectors.groupingBy(
                cv -> cv.getPropertyPath().toString(),
                Collectors.mapping(ConstraintViolation::getMessage, Collectors.toList())
            ));

        ErrorResponse response = ErrorResponse.builder()
            .code(ErrorCode.CMN_005)
            .message("Constraint violation")
            .path(request.getRequestURI())
            .requestId(request.getHeader(HeaderConstants.X_REQUEST_ID))
            .timestamp(Instant.now())
            .fieldErrors(fieldErrors)
            .build();

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle data integrity violations (unique constraint, etc.).
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrityViolation(
            DataIntegrityViolationException ex, HttpServletRequest request) {

        log.error("Data integrity violation", ex);

        String message = "Data integrity constraint violated";
        if (ex.getCause() instanceof ConstraintViolationException) {
            message = "Duplicate or invalid data";
        }

        ApiResponse<Void> response = ApiResponse.error(ErrorCode.CMN_004, message);
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    /**
     * Handle access denied.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {

        log.warn("Access denied: {}", ex.getMessage());

        ApiResponse<Void> response = ApiResponse.error(ErrorCode.AUTH_004, "Access denied");
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    /**
     * Handle all other exceptions.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(
            Exception ex, HttpServletRequest request) {

        log.error("Unexpected error occurred", ex);

        ApiResponse<Void> response = ApiResponse.error(
            ErrorCode.CMN_001,
            "An unexpected error occurred. Please try again later."
        );
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
```

---

## 6. common-database

### 6.1 Purpose

Provides database configuration including RLS interceptor, Flyway migration, and connection pool settings.

### 6.2 Package Structure

```
com.hrsaas.common.database/
├── rls/
│   ├── RlsInterceptor.java
│   └── TenantSqlTransformer.java
├── config/
│   ├── DataSourceConfig.java
│   ├── FlywayConfig.java
│   └── HikariConfig.java
└── migration/
    └── FlywayMigrationStrategy.java
```

### 6.3 RLS Interceptor

```java
/**
 * Hibernate interceptor that sets tenant context for RLS.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RlsInterceptor implements StatementInspector {

    private static final String SET_TENANT_SQL = "SET app.current_tenant = '%s';";

    @Override
    public String inspect(String sql) {
        UUID tenantId = TenantContext.getCurrentTenant();

        if (tenantId == null) {
            // Skip RLS for system operations
            return sql;
        }

        // Prepend tenant context setting
        String tenantSql = String.format(SET_TENANT_SQL, tenantId.toString());
        log.debug("Setting tenant context: {}", tenantId);

        return tenantSql + sql;
    }
}

/**
 * Alternative: Use connection interceptor for tenant context.
 */
@Component
@Slf4j
public class TenantConnectionInterceptor implements ConnectionCustomizer {

    @Override
    public void customize(Connection connection) throws SQLException {
        UUID tenantId = TenantContext.getCurrentTenant();

        if (tenantId != null) {
            try (Statement stmt = connection.createStatement()) {
                stmt.execute("SET app.current_tenant = '" + tenantId + "'");
                log.debug("Set tenant context for connection: {}", tenantId);
            }
        }
    }
}
```

### 6.4 DataSource Configuration

```java
@Configuration
@EnableTransactionManagement
public class DataSourceConfig {

    @Bean
    @ConfigurationProperties("spring.datasource.hikari")
    public HikariConfig hikariConfig() {
        HikariConfig config = new HikariConfig();
        config.setMaximumPoolSize(20);
        config.setMinimumIdle(5);
        config.setIdleTimeout(300000);
        config.setConnectionTimeout(30000);
        config.setMaxLifetime(1800000);
        config.setPoolName("HrSaasPool");
        config.addDataSourceProperty("cachePrepStmts", "true");
        config.addDataSourceProperty("prepStmtCacheSize", "250");
        config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");
        return config;
    }

    @Bean
    public DataSource dataSource(HikariConfig hikariConfig) {
        return new HikariDataSource(hikariConfig);
    }

    @Bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactory(
            DataSource dataSource,
            RlsInterceptor rlsInterceptor) {

        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPackagesToScan("com.hrsaas");

        HibernateJpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        vendorAdapter.setDatabase(Database.POSTGRESQL);
        vendorAdapter.setShowSql(false);
        em.setJpaVendorAdapter(vendorAdapter);

        Map<String, Object> properties = new HashMap<>();
        properties.put("hibernate.session_factory.statement_inspector", rlsInterceptor);
        properties.put("hibernate.jdbc.batch_size", 50);
        properties.put("hibernate.order_inserts", true);
        properties.put("hibernate.order_updates", true);
        properties.put("hibernate.jdbc.batch_versioned_data", true);
        em.setJpaPropertyMap(properties);

        return em;
    }
}
```

### 6.5 Flyway Configuration

```java
@Configuration
public class FlywayConfig {

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            // Run baseline for existing databases
            flyway.baseline();
            // Run migrations
            flyway.migrate();
        };
    }

    @Bean
    @ConfigurationProperties("spring.flyway")
    public Flyway flyway(DataSource dataSource) {
        return Flyway.configure()
            .dataSource(dataSource)
            .locations("classpath:db/migration")
            .baselineOnMigrate(true)
            .validateOnMigrate(true)
            .outOfOrder(false)
            .schemas("public")
            .load();
    }
}
```

### 6.6 Migration Naming Convention

```
db/migration/
├── V1__create_schemas.sql
├── V2__create_tenant_tables.sql
├── V3__create_employee_tables.sql
├── V4__create_attendance_tables.sql
├── V5__create_approval_tables.sql
├── V6__create_rls_policies.sql
└── R__update_rls_policies.sql  # Repeatable migration
```

---

## 7. common-tenant

### 7.1 Purpose

Provides multi-tenancy support through ThreadLocal context and request filters.

### 7.2 Package Structure

```
com.hrsaas.common.tenant/
├── TenantContext.java
├── TenantHolder.java
├── filter/
│   ├── TenantFilter.java
│   └── TenantWebFilter.java
├── resolver/
│   └── TenantResolver.java
└── propagation/
    ├── TenantTaskDecorator.java
    └── TenantFeignInterceptor.java
```

### 7.3 Tenant Context

```java
/**
 * ThreadLocal holder for tenant context.
 */
public final class TenantContext {

    private static final ThreadLocal<TenantHolder> CONTEXT = new ThreadLocal<>();

    private TenantContext() {}

    public static void setCurrentTenant(UUID tenantId) {
        CONTEXT.set(new TenantHolder(tenantId));
    }

    public static void setCurrentTenant(UUID tenantId, String tenantCode) {
        CONTEXT.set(new TenantHolder(tenantId, tenantCode));
    }

    public static UUID getCurrentTenant() {
        TenantHolder holder = CONTEXT.get();
        return holder != null ? holder.getTenantId() : null;
    }

    public static String getCurrentTenantCode() {
        TenantHolder holder = CONTEXT.get();
        return holder != null ? holder.getTenantCode() : null;
    }

    public static TenantHolder getHolder() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }

    public static void requireTenant() {
        if (getCurrentTenant() == null) {
            throw new IllegalStateException("Tenant context is not set");
        }
    }
}

/**
 * Tenant information holder.
 */
@Data
@AllArgsConstructor
public class TenantHolder {

    private final UUID tenantId;
    private final String tenantCode;

    public TenantHolder(UUID tenantId) {
        this(tenantId, null);
    }
}
```

### 7.4 Tenant Filter

```java
/**
 * Servlet filter that extracts tenant from request headers.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class TenantFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        try {
            String tenantIdHeader = request.getHeader(HeaderConstants.X_TENANT_ID);

            if (tenantIdHeader != null) {
                UUID tenantId = UUID.fromString(tenantIdHeader);
                TenantContext.setCurrentTenant(tenantId);
                log.debug("Tenant context set: {}", tenantId);
            }

            filterChain.doFilter(request, response);

        } finally {
            TenantContext.clear();
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/actuator") || path.startsWith("/swagger");
    }
}
```

### 7.5 Tenant Propagation

```java
/**
 * Task decorator for async tenant propagation.
 */
@Component
public class TenantTaskDecorator implements TaskDecorator {

    @Override
    public Runnable decorate(Runnable runnable) {
        TenantHolder holder = TenantContext.getHolder();

        return () -> {
            try {
                if (holder != null) {
                    TenantContext.setCurrentTenant(holder.getTenantId(), holder.getTenantCode());
                }
                runnable.run();
            } finally {
                TenantContext.clear();
            }
        };
    }
}

/**
 * Feign interceptor for tenant header propagation.
 */
@Component
public class TenantFeignInterceptor implements RequestInterceptor {

    @Override
    public void apply(RequestTemplate template) {
        UUID tenantId = TenantContext.getCurrentTenant();

        if (tenantId != null) {
            template.header(HeaderConstants.X_TENANT_ID, tenantId.toString());
        }

        // Also propagate user context
        UUID userId = SecurityContextHolder.getCurrentUserId();
        if (userId != null) {
            template.header(HeaderConstants.X_USER_ID, userId.toString());
        }
    }
}
```

---

## 8. common-security

### 8.1 Purpose

Provides security utilities including JWT processing, permission checking, and role hierarchy.

### 8.2 Package Structure

```
com.hrsaas.common.security/
├── jwt/
│   ├── JwtTokenProvider.java
│   └── JwtClaims.java
├── permission/
│   ├── PermissionChecker.java
│   ├── Permission.java
│   └── PermissionEvaluator.java
├── role/
│   ├── Role.java
│   └── RoleHierarchyConfig.java
├── context/
│   └── SecurityContextHolder.java
└── annotation/
    ├── RequirePermission.java
    └── RequireRole.java
```

### 8.3 JWT Claims

```java
/**
 * JWT claim extraction utilities.
 */
@UtilityClass
public class JwtClaims {

    public static final String TENANT_ID = "tenant_id";
    public static final String TENANT_CODE = "tenant_code";
    public static final String EMPLOYEE_ID = "employee_id";
    public static final String EMPLOYEE_NUMBER = "employee_number";
    public static final String DEPARTMENT_ID = "department_id";
    public static final String ROLES = "roles";
    public static final String PERMISSIONS = "permissions";

    public static UUID extractTenantId(Jwt jwt) {
        String tenantId = jwt.getClaimAsString(TENANT_ID);
        return tenantId != null ? UUID.fromString(tenantId) : null;
    }

    public static String extractTenantCode(Jwt jwt) {
        return jwt.getClaimAsString(TENANT_CODE);
    }

    public static UUID extractEmployeeId(Jwt jwt) {
        String employeeId = jwt.getClaimAsString(EMPLOYEE_ID);
        return employeeId != null ? UUID.fromString(employeeId) : null;
    }

    public static List<String> extractRoles(Jwt jwt) {
        return jwt.getClaimAsStringList(ROLES);
    }

    public static List<String> extractPermissions(Jwt jwt) {
        return jwt.getClaimAsStringList(PERMISSIONS);
    }
}
```

### 8.4 Security Context Holder

```java
/**
 * Custom security context holder for HR-specific user info.
 */
public final class SecurityContextHolder {

    private SecurityContextHolder() {}

    public static UUID getCurrentUserId() {
        Authentication auth = org.springframework.security.core.context.SecurityContextHolder
            .getContext().getAuthentication();

        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            return UUID.fromString(jwtAuth.getToken().getSubject());
        }
        return null;
    }

    public static UUID getCurrentEmployeeId() {
        Authentication auth = org.springframework.security.core.context.SecurityContextHolder
            .getContext().getAuthentication();

        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            return JwtClaims.extractEmployeeId(jwtAuth.getToken());
        }
        return null;
    }

    public static UUID getCurrentTenantId() {
        Authentication auth = org.springframework.security.core.context.SecurityContextHolder
            .getContext().getAuthentication();

        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            return JwtClaims.extractTenantId(jwtAuth.getToken());
        }
        return TenantContext.getCurrentTenant();
    }

    public static List<String> getCurrentRoles() {
        Authentication auth = org.springframework.security.core.context.SecurityContextHolder
            .getContext().getAuthentication();

        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            return JwtClaims.extractRoles(jwtAuth.getToken());
        }
        return Collections.emptyList();
    }

    public static boolean hasRole(String role) {
        return getCurrentRoles().contains(role);
    }

    public static boolean hasAnyRole(String... roles) {
        List<String> currentRoles = getCurrentRoles();
        return Arrays.stream(roles).anyMatch(currentRoles::contains);
    }
}
```

### 8.5 Role Hierarchy

```java
/**
 * Role definitions.
 */
public enum Role {
    SUPER_ADMIN(1),
    GROUP_ADMIN(2),
    TENANT_ADMIN(3),
    HR_MANAGER(4),
    DEPT_MANAGER(5),
    TEAM_LEADER(6),
    EMPLOYEE(7);

    private final int level;

    Role(int level) {
        this.level = level;
    }

    public int getLevel() { return level; }

    public boolean isHigherOrEqual(Role other) {
        return this.level <= other.level;
    }
}

/**
 * Role hierarchy configuration.
 */
@Configuration
public class RoleHierarchyConfig {

    @Bean
    public RoleHierarchy roleHierarchy() {
        RoleHierarchyImpl hierarchy = new RoleHierarchyImpl();
        hierarchy.setHierarchy("""
            ROLE_SUPER_ADMIN > ROLE_GROUP_ADMIN
            ROLE_GROUP_ADMIN > ROLE_TENANT_ADMIN
            ROLE_TENANT_ADMIN > ROLE_HR_MANAGER
            ROLE_HR_MANAGER > ROLE_DEPT_MANAGER
            ROLE_DEPT_MANAGER > ROLE_TEAM_LEADER
            ROLE_TEAM_LEADER > ROLE_EMPLOYEE
            """);
        return hierarchy;
    }
}
```

### 8.6 Permission Checker

```java
/**
 * Permission checking service.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionChecker {

    private final RoleHierarchy roleHierarchy;

    /**
     * Check if current user has the specified permission.
     */
    public boolean hasPermission(String permission) {
        Authentication auth = org.springframework.security.core.context.SecurityContextHolder
            .getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }

        // Check direct permissions from JWT
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            List<String> permissions = JwtClaims.extractPermissions(jwtAuth.getToken());
            if (permissions.contains(permission) || permissions.contains("*:*")) {
                return true;
            }

            // Check wildcard permissions (e.g., employee:* matches employee:read)
            String resource = permission.split(":")[0];
            if (permissions.contains(resource + ":*")) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if current user can access a specific resource.
     */
    public boolean canAccess(UUID resourceTenantId) {
        UUID currentTenantId = SecurityContextHolder.getCurrentTenantId();

        // Same tenant access
        if (currentTenantId.equals(resourceTenantId)) {
            return true;
        }

        // Super admin can access all
        if (SecurityContextHolder.hasRole("SUPER_ADMIN")) {
            return true;
        }

        // Group admin can access subsidiaries (would need to check hierarchy)
        return false;
    }
}

/**
 * Custom annotation for permission checking.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {
    String value();
}

/**
 * AOP aspect for permission checking.
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class PermissionAspect {

    private final PermissionChecker permissionChecker;

    @Before("@annotation(requirePermission)")
    public void checkPermission(JoinPoint joinPoint, RequirePermission requirePermission) {
        String permission = requirePermission.value();

        if (!permissionChecker.hasPermission(permission)) {
            log.warn("Permission denied: {} for user {}",
                permission, SecurityContextHolder.getCurrentUserId());
            throw new ForbiddenException("Insufficient permissions: " + permission);
        }
    }
}
```

---

## 9. common-privacy

### 9.1 Purpose

Provides privacy protection utilities including data masking and encryption.

### 9.2 Package Structure

```
com.hrsaas.common.privacy/
├── masking/
│   ├── MaskingService.java
│   ├── MaskingType.java
│   └── annotation/
│       └── Masked.java
├── encryption/
│   ├── EncryptionService.java
│   ├── AesEncryptor.java
│   └── annotation/
│       └── Encrypted.java
└── logging/
    ├── PrivacyAccessLog.java
    └── PrivacyAccessLogger.java
```

### 9.3 Masking Service

```java
/**
 * Masking types for different data types.
 */
public enum MaskingType {
    NAME,           // 홍*동
    PHONE,          // 010-****-5678
    EMAIL,          // ho***@example.com
    RESIDENT_NUMBER,// 850515-1******
    BANK_ACCOUNT,   // ***-****-1234
    ADDRESS,        // 서울시 강남구 ***
    CARD_NUMBER     // ****-****-****-1234
}

/**
 * Masking service implementation.
 */
@Service
@Slf4j
public class MaskingService {

    public String mask(String value, MaskingType type) {
        if (value == null || value.isEmpty()) {
            return value;
        }

        return switch (type) {
            case NAME -> maskName(value);
            case PHONE -> maskPhone(value);
            case EMAIL -> maskEmail(value);
            case RESIDENT_NUMBER -> maskResidentNumber(value);
            case BANK_ACCOUNT -> maskBankAccount(value);
            case ADDRESS -> maskAddress(value);
            case CARD_NUMBER -> maskCardNumber(value);
        };
    }

    public String maskName(String name) {
        if (name == null || name.length() < 2) return "**";
        if (name.length() == 2) return name.charAt(0) + "*";
        return name.charAt(0) + "*".repeat(name.length() - 2) + name.charAt(name.length() - 1);
    }

    public String maskPhone(String phone) {
        if (phone == null || phone.length() < 8) return "***-****-****";
        return phone.replaceAll("(\\d{3})[-.]?(\\d{4})[-.]?(\\d{4})", "$1-****-$3");
    }

    public String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***@***.***";
        String[] parts = email.split("@");
        String local = parts[0];
        String domain = parts[1];
        if (local.length() <= 2) return "**@" + domain;
        return local.substring(0, 2) + "***@" + domain;
    }

    public String maskResidentNumber(String residentNumber) {
        if (residentNumber == null || residentNumber.length() != 14) return "******-*******";
        return residentNumber.substring(0, 6) + "-" + residentNumber.charAt(7) + "******";
    }

    public String maskBankAccount(String account) {
        if (account == null || account.length() < 4) return "***-****-****";
        return "***-****-" + account.substring(account.length() - 4);
    }

    public String maskAddress(String address) {
        if (address == null || address.length() < 10) return "***";
        String[] parts = address.split(" ");
        if (parts.length >= 2) {
            return parts[0] + " " + parts[1] + " ***";
        }
        return address.substring(0, Math.min(10, address.length())) + "***";
    }

    public String maskCardNumber(String cardNumber) {
        if (cardNumber == null || cardNumber.length() < 16) return "****-****-****-****";
        String digits = cardNumber.replaceAll("[^0-9]", "");
        return "****-****-****-" + digits.substring(digits.length() - 4);
    }
}

/**
 * Annotation for automatic masking in DTOs.
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Masked {
    MaskingType type();
}

/**
 * Jackson serializer for masked fields.
 */
public class MaskedSerializer extends JsonSerializer<String> {

    private final MaskingService maskingService;
    private final MaskingType maskingType;

    public MaskedSerializer(MaskingService maskingService, MaskingType type) {
        this.maskingService = maskingService;
        this.maskingType = type;
    }

    @Override
    public void serialize(String value, JsonGenerator gen, SerializerProvider serializers)
            throws IOException {
        if (PrivacyContext.isUnmasked()) {
            gen.writeString(value);
        } else {
            gen.writeString(maskingService.mask(value, maskingType));
        }
    }
}
```

### 9.4 Encryption Service

```java
/**
 * AES encryption service for sensitive data.
 */
@Service
@Slf4j
public class EncryptionService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    private final SecretKey secretKey;

    public EncryptionService(@Value("${app.encryption.key}") String base64Key) {
        byte[] keyBytes = Base64.getDecoder().decode(base64Key);
        this.secretKey = new SecretKeySpec(keyBytes, "AES");
    }

    public byte[] encrypt(String plainText) {
        if (plainText == null) return null;

        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            SecureRandom random = new SecureRandom();
            random.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, spec);

            byte[] cipherText = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            // Combine IV and ciphertext
            byte[] result = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, result, 0, iv.length);
            System.arraycopy(cipherText, 0, result, iv.length, cipherText.length);

            return result;
        } catch (Exception e) {
            log.error("Encryption failed", e);
            throw new RuntimeException("Encryption failed", e);
        }
    }

    public String decrypt(byte[] encryptedData) {
        if (encryptedData == null) return null;

        try {
            // Extract IV
            byte[] iv = new byte[GCM_IV_LENGTH];
            System.arraycopy(encryptedData, 0, iv, 0, iv.length);

            // Extract ciphertext
            byte[] cipherText = new byte[encryptedData.length - iv.length];
            System.arraycopy(encryptedData, iv.length, cipherText, 0, cipherText.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec);

            byte[] plainText = cipher.doFinal(cipherText);
            return new String(plainText, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Decryption failed", e);
            throw new RuntimeException("Decryption failed", e);
        }
    }

    public String encryptToBase64(String plainText) {
        byte[] encrypted = encrypt(plainText);
        return encrypted != null ? Base64.getEncoder().encodeToString(encrypted) : null;
    }

    public String decryptFromBase64(String base64Encrypted) {
        if (base64Encrypted == null) return null;
        byte[] encrypted = Base64.getDecoder().decode(base64Encrypted);
        return decrypt(encrypted);
    }
}

/**
 * JPA attribute converter for encrypted fields.
 */
@Converter
public class EncryptedStringConverter implements AttributeConverter<String, byte[]> {

    @Autowired
    private EncryptionService encryptionService;

    @Override
    public byte[] convertToDatabaseColumn(String attribute) {
        return encryptionService.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(byte[] dbData) {
        return encryptionService.decrypt(dbData);
    }
}
```

---

## 10. common-cache

### 10.1 Purpose

Provides Redis caching utilities with tenant-aware cache keys.

### 10.2 Package Structure

```
com.hrsaas.common.cache/
├── config/
│   └── RedisCacheConfig.java
├── key/
│   ├── CacheKeyGenerator.java
│   └── TenantAwareCacheKey.java
├── service/
│   └── CacheService.java
└── ttl/
    └── CacheTtlPolicy.java
```

### 10.3 Cache Key Generator

```java
/**
 * Tenant-aware cache key generator.
 */
@Component
public class TenantAwareCacheKeyGenerator implements KeyGenerator {

    @Override
    public Object generate(Object target, Method method, Object... params) {
        UUID tenantId = TenantContext.getCurrentTenant();

        StringBuilder keyBuilder = new StringBuilder();

        // Add tenant prefix
        if (tenantId != null) {
            keyBuilder.append("t:").append(tenantId).append(":");
        }

        // Add class and method name
        keyBuilder.append(target.getClass().getSimpleName())
                  .append(":")
                  .append(method.getName());

        // Add parameters
        for (Object param : params) {
            keyBuilder.append(":").append(param);
        }

        return keyBuilder.toString();
    }
}

/**
 * Cache key constants and builders.
 */
public final class CacheKeys {

    private CacheKeys() {}

    // Key prefixes
    public static final String TENANT_CONFIG = "tenant:config:";
    public static final String TENANT_POLICY = "tenant:policy:";
    public static final String EMPLOYEE = "employee:";
    public static final String DEPARTMENT = "department:";
    public static final String CODE = "mdm:code:";
    public static final String APPROVAL_LINE = "approval:line:";
    public static final String SESSION = "session:";

    // Key builders
    public static String tenantConfig(UUID tenantId) {
        return TENANT_CONFIG + tenantId;
    }

    public static String tenantPolicy(UUID tenantId, String policyType) {
        return TENANT_POLICY + tenantId + ":" + policyType;
    }

    public static String employee(UUID tenantId, UUID employeeId) {
        return EMPLOYEE + tenantId + ":" + employeeId;
    }

    public static String department(UUID tenantId, UUID departmentId) {
        return DEPARTMENT + tenantId + ":" + departmentId;
    }

    public static String code(String groupCode) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return CODE + (tenantId != null ? tenantId + ":" : "") + groupCode;
    }
}
```

### 10.4 Redis Cache Configuration

```java
@Configuration
@EnableCaching
public class RedisCacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(30))
            .serializeKeysWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new GenericJackson2JsonRedisSerializer()));

        // Cache-specific configurations
        Map<String, RedisCacheConfiguration> cacheConfigs = Map.of(
            "tenantConfig", defaultConfig.entryTtl(Duration.ofHours(1)),
            "tenantPolicy", defaultConfig.entryTtl(Duration.ofMinutes(30)),
            "employee", defaultConfig.entryTtl(Duration.ofMinutes(30)),
            "department", defaultConfig.entryTtl(Duration.ofMinutes(10)),
            "codes", defaultConfig.entryTtl(Duration.ofMinutes(30)),
            "approvalLine", defaultConfig.entryTtl(Duration.ofMinutes(5))
        );

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(cacheConfigs)
            .build();
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        return template;
    }

    @Bean
    public KeyGenerator tenantAwareCacheKeyGenerator() {
        return new TenantAwareCacheKeyGenerator();
    }
}
```

### 10.5 Cache Service

```java
/**
 * Utility service for cache operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CacheService {

    private final RedisTemplate<String, Object> redisTemplate;

    public <T> Optional<T> get(String key, Class<T> type) {
        Object value = redisTemplate.opsForValue().get(key);
        if (value == null) {
            return Optional.empty();
        }
        return Optional.of(type.cast(value));
    }

    public void set(String key, Object value, Duration ttl) {
        redisTemplate.opsForValue().set(key, value, ttl);
    }

    public void delete(String key) {
        redisTemplate.delete(key);
    }

    public void deleteByPattern(String pattern) {
        Set<String> keys = redisTemplate.keys(pattern);
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
            log.debug("Deleted {} keys matching pattern: {}", keys.size(), pattern);
        }
    }

    public void evictTenantCache(UUID tenantId) {
        String pattern = "*:" + tenantId + ":*";
        deleteByPattern(pattern);
    }

    public boolean exists(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    public void expire(String key, Duration ttl) {
        redisTemplate.expire(key, ttl);
    }
}
```

---

## 11. common-event

### 11.1 Purpose

Provides Kafka event publishing utilities and domain event base classes.

### 11.2 Package Structure

```
com.hrsaas.common.event/
├── DomainEvent.java
├── EventMetadata.java
├── publisher/
│   ├── EventPublisher.java
│   └── KafkaEventPublisher.java
├── consumer/
│   ├── EventConsumer.java
│   └── RetryableEventConsumer.java
├── config/
│   └── KafkaConfig.java
└── topic/
    └── TopicNames.java
```

### 11.3 Domain Event Base Class

```java
/**
 * Base class for all domain events.
 */
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public abstract class DomainEvent {

    private String eventId;
    private String eventType;
    private UUID tenantId;
    private UUID aggregateId;
    private String aggregateType;
    private Instant occurredAt;
    private UUID triggeredBy;
    private String correlationId;
    private int version;

    @PrePersist
    protected void prePersist() {
        if (eventId == null) {
            eventId = UUID.randomUUID().toString();
        }
        if (occurredAt == null) {
            occurredAt = Instant.now();
        }
        if (tenantId == null) {
            tenantId = TenantContext.getCurrentTenant();
        }
        if (triggeredBy == null) {
            triggeredBy = SecurityContextHolder.getCurrentUserId();
        }
        if (version == 0) {
            version = 1;
        }
    }
}

/**
 * Event metadata for Kafka headers.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventMetadata {

    private String eventId;
    private String eventType;
    private String tenantId;
    private String correlationId;
    private Instant timestamp;
    private String source;

    public static EventMetadata from(DomainEvent event) {
        return EventMetadata.builder()
            .eventId(event.getEventId())
            .eventType(event.getEventType())
            .tenantId(event.getTenantId() != null ? event.getTenantId().toString() : null)
            .correlationId(event.getCorrelationId())
            .timestamp(event.getOccurredAt())
            .build();
    }
}
```

### 11.4 Kafka Event Publisher

```java
/**
 * Kafka event publisher service.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaEventPublisher implements EventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Override
    public void publish(String topic, DomainEvent event) {
        try {
            // Set event metadata if not set
            if (event.getEventId() == null) {
                event.prePersist();
            }

            // Create Kafka headers
            ProducerRecord<String, Object> record = new ProducerRecord<>(
                topic,
                event.getAggregateId() != null ? event.getAggregateId().toString() : null,
                event
            );

            record.headers()
                .add("eventId", event.getEventId().getBytes())
                .add("eventType", event.getEventType().getBytes())
                .add("timestamp", event.getOccurredAt().toString().getBytes());

            if (event.getTenantId() != null) {
                record.headers().add("tenantId", event.getTenantId().toString().getBytes());
            }
            if (event.getCorrelationId() != null) {
                record.headers().add("correlationId", event.getCorrelationId().getBytes());
            }

            kafkaTemplate.send(record)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish event: {} to topic: {}",
                            event.getEventType(), topic, ex);
                    } else {
                        log.debug("Published event: {} to topic: {} partition: {} offset: {}",
                            event.getEventType(), topic,
                            result.getRecordMetadata().partition(),
                            result.getRecordMetadata().offset());
                    }
                });

        } catch (Exception e) {
            log.error("Error publishing event: {} to topic: {}", event.getEventType(), topic, e);
            throw new RuntimeException("Event publishing failed", e);
        }
    }

    @Override
    public void publish(DomainEvent event) {
        String topic = TopicNames.forEvent(event.getEventType());
        publish(topic, event);
    }
}
```

### 11.5 Topic Names

```java
/**
 * Kafka topic name constants and utilities.
 */
public final class TopicNames {

    private TopicNames() {}

    // Topic name prefix
    public static final String PREFIX = "hr-saas.";

    // Domain topics
    public static final String TENANT_EVENTS = PREFIX + "tenant.events";
    public static final String ORGANIZATION_EVENTS = PREFIX + "organization.events";
    public static final String EMPLOYEE_EVENTS = PREFIX + "employee.events";
    public static final String ATTENDANCE_EVENTS = PREFIX + "attendance.events";
    public static final String APPROVAL_EVENTS = PREFIX + "approval.events";
    public static final String MDM_EVENTS = PREFIX + "mdm.events";
    public static final String NOTIFICATION_EVENTS = PREFIX + "notification.events";
    public static final String AUDIT_EVENTS = PREFIX + "audit.events";

    // Specific event topics
    public static final String TENANT_CREATED = PREFIX + "tenant.created";
    public static final String TENANT_UPDATED = PREFIX + "tenant.updated";
    public static final String EMPLOYEE_CREATED = PREFIX + "employee.created";
    public static final String EMPLOYEE_RESIGNED = PREFIX + "employee.resigned";
    public static final String APPROVAL_REQUESTED = PREFIX + "approval.requested";
    public static final String APPROVAL_COMPLETED = PREFIX + "approval.completed";
    public static final String LEAVE_REQUESTED = PREFIX + "attendance.leave-requested";

    /**
     * Get topic name for event type.
     */
    public static String forEvent(String eventType) {
        return PREFIX + eventType.toLowerCase().replace("_", ".");
    }
}
```

### 11.6 Kafka Configuration

```java
@Configuration
@EnableKafka
public class KafkaConfig {

    @Bean
    public ProducerFactory<String, Object> producerFactory(
            @Value("${spring.kafka.bootstrap-servers}") String bootstrapServers) {

        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        props.put(ProducerConfig.ACKS_CONFIG, "all");
        props.put(ProducerConfig.RETRIES_CONFIG, 3);
        props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);

        return new DefaultKafkaProducerFactory<>(props);
    }

    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate(
            ProducerFactory<String, Object> producerFactory) {
        return new KafkaTemplate<>(producerFactory);
    }

    @Bean
    public ConsumerFactory<String, Object> consumerFactory(
            @Value("${spring.kafka.bootstrap-servers}") String bootstrapServers,
            @Value("${spring.kafka.consumer.group-id}") String groupId) {

        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        props.put(JsonDeserializer.TRUSTED_PACKAGES, "com.hrsaas.*");

        return new DefaultKafkaConsumerFactory<>(props);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, Object> kafkaListenerContainerFactory(
            ConsumerFactory<String, Object> consumerFactory) {

        ConcurrentKafkaListenerContainerFactory<String, Object> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);
        factory.setConcurrency(3);
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);

        return factory;
    }
}
```

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-02-03 | - | Initial creation |

---

**End of Document**
