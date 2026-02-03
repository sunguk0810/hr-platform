# HR Platform 개발 가이드

## 목차
1. [로컬 개발 환경 설정](#1-로컬-개발-환경-설정)
2. [코딩 컨벤션](#2-코딩-컨벤션)
3. [테스트 가이드](#3-테스트-가이드)
4. [Git 워크플로우](#4-git-워크플로우)
5. [디버깅 가이드](#5-디버깅-가이드)

---

## 1. 로컬 개발 환경 설정

### 1.1 필수 소프트웨어

| 소프트웨어 | 버전 | 용도 |
|-----------|------|------|
| JDK | 17+ (Temurin/Corretto 권장) | 런타임 |
| Gradle | 8.5+ | 빌드 도구 |
| Docker Desktop | 최신 | 컨테이너 환경 |
| Git | 2.40+ | 버전 관리 |
| IDE | IntelliJ IDEA 2023.3+ | 개발 환경 |

### 1.2 환경 변수 설정

```bash
# Windows (시스템 환경 변수)
JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.x.x
GRADLE_USER_HOME=C:\Users\{username}\.gradle

# PATH에 추가
%JAVA_HOME%\bin
%GRADLE_USER_HOME%\bin
```

### 1.3 Docker 환경 시작

```bash
# 프로젝트 루트에서 실행
cd docker
docker-compose up -d

# 서비스 상태 확인
docker-compose ps

# 개별 서비스 로그 확인
docker-compose logs -f postgres
docker-compose logs -f kafka
```

### 1.4 Docker 서비스 포트

| 서비스 | 포트 | 접속 정보 |
|--------|------|----------|
| PostgreSQL | 5432 | `postgres` / `postgres` / `hr_platform` |
| Redis | 6379 | 비밀번호 없음 (개발용) |
| Kafka | 9092 | `localhost:9092` |
| Kafka UI | 8090 | http://localhost:8090 |
| Keycloak | 8180 | `admin` / `admin` |
| Jaeger | 16686 | http://localhost:16686 |
| Prometheus | 9090 | http://localhost:9090 |
| Grafana | 3000 | `admin` / `admin` |

### 1.5 데이터베이스 접속

```bash
# psql 클라이언트
docker exec -it hr-postgres psql -U postgres -d hr_platform

# 스키마 확인
\dn

# 테이블 목록
\dt tenant_common.*
\dt hr_core.*
```

### 1.6 서비스 실행 순서

```bash
# 1. Config Server (필수 - 먼저 시작)
./gradlew :infra:config-server:bootRun

# 2. Gateway Service
./gradlew :services:gateway-service:bootRun

# 3. 핵심 서비스 (순서 무관)
./gradlew :services:auth-service:bootRun
./gradlew :services:tenant-service:bootRun
./gradlew :services:mdm-service:bootRun

# 4. 업무 서비스
./gradlew :services:organization-service:bootRun
./gradlew :services:employee-service:bootRun
# ... 나머지 서비스
```

### 1.7 IntelliJ IDEA 설정

#### Gradle 설정
```
File > Settings > Build, Execution, Deployment > Build Tools > Gradle
- Build and run using: IntelliJ IDEA
- Run tests using: IntelliJ IDEA
- Gradle JVM: 17
```

#### Annotation Processing
```
File > Settings > Build, Execution, Deployment > Compiler > Annotation Processors
- Enable annotation processing: 체크
- Obtain processors from project classpath: 선택
```

#### Code Style 적용
```
File > Settings > Editor > Code Style > Java
- Import scheme: GoogleStyle (또는 프로젝트 제공 XML)
```

#### Lombok 플러그인
```
File > Settings > Plugins
- Lombok 검색 및 설치
```

#### 멀티모듈 실행 구성
```
Run > Edit Configurations > Add New > Spring Boot

예시 (Auth Service):
- Name: AuthServiceApplication
- Main class: com.hrplatform.auth.AuthServiceApplication
- VM options: -Dspring.profiles.active=local
- Working directory: $MODULE_DIR$
```

---

## 2. 코딩 컨벤션

### 2.1 네이밍 규칙

#### 패키지
```
com.hrplatform.{service}.{layer}.{feature}

예시:
com.hrplatform.employee.domain.entity
com.hrplatform.employee.application.service
com.hrplatform.employee.adapter.in.web
com.hrplatform.employee.adapter.out.persistence
```

#### 클래스
| 유형 | 패턴 | 예시 |
|------|------|------|
| Entity | `{Name}` | `Employee`, `Department` |
| Repository | `{Entity}Repository` | `EmployeeRepository` |
| Service | `{Domain}Service` | `EmployeeService` |
| UseCase | `{Action}{Target}UseCase` | `CreateEmployeeUseCase` |
| Controller | `{Domain}Controller` | `EmployeeController` |
| DTO Request | `{Action}{Target}Request` | `CreateEmployeeRequest` |
| DTO Response | `{Target}Response` | `EmployeeResponse` |
| Mapper | `{Entity}Mapper` | `EmployeeMapper` |
| Exception | `{Reason}Exception` | `EmployeeNotFoundException` |

#### 메서드
```java
// 조회 (단건)
findById(Long id)
findByEmployeeNumber(String employeeNumber)
getById(Long id)  // 없으면 예외 발생

// 조회 (다건)
findAll()
findAllByDepartmentId(Long departmentId)
searchByCondition(SearchCondition condition)

// 생성
create(CreateRequest request)
save(Entity entity)

// 수정
update(Long id, UpdateRequest request)
updateStatus(Long id, Status status)

// 삭제
delete(Long id)
softDelete(Long id)

// 검증
validateDuplicate(String value)
existsById(Long id)

// 변환
toEntity(Request request)
toResponse(Entity entity)
```

### 2.2 패키지 구조 (Hexagonal Architecture)

```
{service}/
├── domain/                      # 도메인 계층
│   ├── entity/                  # JPA 엔티티
│   ├── vo/                      # Value Object
│   ├── event/                   # 도메인 이벤트
│   └── repository/              # Repository 인터페이스
│
├── application/                 # 애플리케이션 계층
│   ├── port/
│   │   ├── in/                  # UseCase 인터페이스
│   │   └── out/                 # 외부 연동 인터페이스
│   ├── service/                 # UseCase 구현체
│   └── dto/                     # Command/Query DTO
│
├── adapter/                     # 어댑터 계층
│   ├── in/
│   │   └── web/                 # REST Controller
│   └── out/
│       ├── persistence/         # Repository 구현체
│       ├── kafka/               # Kafka Producer/Consumer
│       └── client/              # 외부 API 클라이언트
│
└── config/                      # 설정
```

### 2.3 코드 스타일

#### 클래스 구조 순서
```java
@Entity
@Table(name = "employee")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Employee extends TenantAwareEntity {

    // 1. 상수
    private static final int MAX_NAME_LENGTH = 100;

    // 2. 필드 (id → 필수 → 선택 → 연관관계)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String employeeNumber;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    private EmployeeStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    // 3. 생성자 (정적 팩토리 메서드 권장)
    @Builder
    private Employee(String employeeNumber, String name, Department department) {
        this.employeeNumber = employeeNumber;
        this.name = name;
        this.department = department;
        this.status = EmployeeStatus.ACTIVE;
    }

    public static Employee create(String employeeNumber, String name, Department department) {
        return Employee.builder()
            .employeeNumber(employeeNumber)
            .name(name)
            .department(department)
            .build();
    }

    // 4. 비즈니스 메서드
    public void transfer(Department newDepartment) {
        this.department = newDepartment;
    }

    public void retire() {
        this.status = EmployeeStatus.RETIRED;
    }

    // 5. 검증 메서드
    public boolean isActive() {
        return this.status == EmployeeStatus.ACTIVE;
    }
}
```

#### Service 클래스 구조
```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class EmployeeService implements CreateEmployeeUseCase, UpdateEmployeeUseCase {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public EmployeeResponse create(CreateEmployeeRequest request) {
        // 1. 검증
        validateDuplicateEmployeeNumber(request.getEmployeeNumber());

        // 2. 조회
        Department department = departmentRepository.getById(request.getDepartmentId());

        // 3. 생성
        Employee employee = Employee.create(
            request.getEmployeeNumber(),
            request.getName(),
            department
        );

        // 4. 저장
        Employee saved = employeeRepository.save(employee);

        // 5. 이벤트 발행
        eventPublisher.publishEvent(new EmployeeCreatedEvent(saved));

        // 6. 응답 변환
        return EmployeeMapper.toResponse(saved);
    }

    private void validateDuplicateEmployeeNumber(String employeeNumber) {
        if (employeeRepository.existsByEmployeeNumber(employeeNumber)) {
            throw new DuplicateEmployeeNumberException(employeeNumber);
        }
    }
}
```

#### Controller 클래스 구조
```java
@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
@Tag(name = "Employee", description = "직원 관리 API")
public class EmployeeController {

    private final CreateEmployeeUseCase createEmployeeUseCase;
    private final GetEmployeeUseCase getEmployeeUseCase;

    @PostMapping
    @Operation(summary = "직원 생성")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<EmployeeResponse> create(
            @Valid @RequestBody CreateEmployeeRequest request) {
        return ApiResponse.success(createEmployeeUseCase.create(request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "직원 상세 조회")
    public ApiResponse<EmployeeResponse> getById(
            @PathVariable Long id) {
        return ApiResponse.success(getEmployeeUseCase.getById(id));
    }

    @GetMapping
    @Operation(summary = "직원 목록 조회")
    public ApiResponse<PageResponse<EmployeeResponse>> search(
            @ModelAttribute EmployeeSearchCondition condition,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(getEmployeeUseCase.search(condition, pageable));
    }
}
```

### 2.4 로깅 규칙

```java
@Slf4j
public class EmployeeService {

    public Employee create(CreateEmployeeRequest request) {
        // DEBUG: 메서드 진입/파라미터
        log.debug("Creating employee: {}", request);

        // INFO: 비즈니스 이벤트
        log.info("Employee created: id={}, employeeNumber={}",
            saved.getId(), saved.getEmployeeNumber());

        // WARN: 예상된 예외 상황
        log.warn("Employee not found for update: id={}", id);

        // ERROR: 예상치 못한 오류
        log.error("Failed to create employee: {}", request, exception);

        return saved;
    }
}
```

#### 로그 레벨 가이드
| 레벨 | 용도 | 예시 |
|------|------|------|
| TRACE | 상세 디버깅 | SQL 파라미터, 루프 내부 |
| DEBUG | 개발 디버깅 | 메서드 진입/종료, 변수 값 |
| INFO | 비즈니스 이벤트 | 사용자 로그인, 주문 생성 |
| WARN | 예상된 문제 | 재시도, 폴백, 데이터 누락 |
| ERROR | 시스템 오류 | 예외, 외부 연동 실패 |

### 2.5 예외 처리 규칙

```java
// 비즈니스 예외는 명시적으로 정의
public class EmployeeNotFoundException extends NotFoundException {
    public EmployeeNotFoundException(Long id) {
        super(ErrorCode.EMPLOYEE_NOT_FOUND, "직원을 찾을 수 없습니다: " + id);
    }
}

// Repository에서 예외 변환
public Employee getById(Long id) {
    return employeeRepository.findById(id)
        .orElseThrow(() -> new EmployeeNotFoundException(id));
}

// 검증 예외
if (request.getStartDate().isAfter(request.getEndDate())) {
    throw new InvalidDateRangeException(request.getStartDate(), request.getEndDate());
}
```

---

## 3. 테스트 가이드

### 3.1 테스트 구조

```
src/test/java/
├── unit/                        # 단위 테스트
│   ├── domain/                  # 엔티티/VO 테스트
│   └── application/             # 서비스 테스트 (Mock)
│
├── integration/                 # 통합 테스트
│   ├── repository/              # Repository 테스트
│   └── api/                     # API 테스트
│
└── fixture/                     # 테스트 픽스처
    ├── EmployeeFixture.java
    └── DepartmentFixture.java
```

### 3.2 단위 테스트

#### Entity 테스트
```java
@DisplayName("Employee 엔티티 테스트")
class EmployeeTest {

    @Test
    @DisplayName("직원 생성 시 상태는 ACTIVE")
    void create_shouldSetStatusActive() {
        // given
        Department department = DepartmentFixture.create();

        // when
        Employee employee = Employee.create("EMP001", "홍길동", department);

        // then
        assertThat(employee.getStatus()).isEqualTo(EmployeeStatus.ACTIVE);
        assertThat(employee.getName()).isEqualTo("홍길동");
    }

    @Test
    @DisplayName("퇴사 처리 시 상태는 RETIRED")
    void retire_shouldChangeStatusToRetired() {
        // given
        Employee employee = EmployeeFixture.createActive();

        // when
        employee.retire();

        // then
        assertThat(employee.getStatus()).isEqualTo(EmployeeStatus.RETIRED);
        assertThat(employee.isActive()).isFalse();
    }
}
```

#### Service 테스트 (Mock)
```java
@ExtendWith(MockitoExtension.class)
@DisplayName("EmployeeService 테스트")
class EmployeeServiceTest {

    @InjectMocks
    private EmployeeService employeeService;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Test
    @DisplayName("직원 생성 성공")
    void create_success() {
        // given
        CreateEmployeeRequest request = CreateEmployeeRequest.builder()
            .employeeNumber("EMP001")
            .name("홍길동")
            .departmentId(1L)
            .build();

        Department department = DepartmentFixture.create();
        Employee employee = EmployeeFixture.create();

        given(employeeRepository.existsByEmployeeNumber(anyString())).willReturn(false);
        given(departmentRepository.getById(1L)).willReturn(department);
        given(employeeRepository.save(any())).willReturn(employee);

        // when
        EmployeeResponse response = employeeService.create(request);

        // then
        assertThat(response.getEmployeeNumber()).isEqualTo("EMP001");
        verify(eventPublisher).publishEvent(any(EmployeeCreatedEvent.class));
    }

    @Test
    @DisplayName("중복 사번으로 생성 시 예외")
    void create_duplicateEmployeeNumber_throwsException() {
        // given
        CreateEmployeeRequest request = CreateEmployeeRequest.builder()
            .employeeNumber("EMP001")
            .build();

        given(employeeRepository.existsByEmployeeNumber("EMP001")).willReturn(true);

        // when & then
        assertThatThrownBy(() -> employeeService.create(request))
            .isInstanceOf(DuplicateEmployeeNumberException.class);
    }
}
```

### 3.3 통합 테스트

#### Repository 테스트
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = Replace.NONE)
@Testcontainers
@DisplayName("EmployeeRepository 통합 테스트")
class EmployeeRepositoryIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
        .withDatabaseName("hr_platform_test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("부서별 직원 조회")
    void findAllByDepartmentId_success() {
        // given
        Department department = DepartmentFixture.create();
        entityManager.persist(department);

        Employee employee1 = EmployeeFixture.createWithDepartment(department);
        Employee employee2 = EmployeeFixture.createWithDepartment(department);
        entityManager.persist(employee1);
        entityManager.persist(employee2);
        entityManager.flush();

        // when
        List<Employee> employees = employeeRepository.findAllByDepartmentId(department.getId());

        // then
        assertThat(employees).hasSize(2);
    }
}
```

#### API 테스트
```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Testcontainers
@DisplayName("Employee API 통합 테스트")
class EmployeeApiIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379);

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private EmployeeRepository employeeRepository;

    @BeforeEach
    void setUp() {
        employeeRepository.deleteAll();
    }

    @Test
    @DisplayName("POST /api/v1/employees - 직원 생성")
    void createEmployee_success() {
        // given
        CreateEmployeeRequest request = CreateEmployeeRequest.builder()
            .employeeNumber("EMP001")
            .name("홍길동")
            .departmentId(1L)
            .build();

        // when
        ResponseEntity<ApiResponse<EmployeeResponse>> response = restTemplate.exchange(
            "/api/v1/employees",
            HttpMethod.POST,
            new HttpEntity<>(request, createHeaders()),
            new ParameterizedTypeReference<>() {}
        );

        // then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().getData().getEmployeeNumber()).isEqualTo("EMP001");
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Tenant-Id", "test-tenant-id");
        headers.setBearerAuth(getTestToken());
        return headers;
    }
}
```

### 3.4 테스트 픽스처

```java
public class EmployeeFixture {

    public static Employee create() {
        return Employee.builder()
            .employeeNumber("EMP001")
            .name("홍길동")
            .email("hong@example.com")
            .status(EmployeeStatus.ACTIVE)
            .build();
    }

    public static Employee createActive() {
        return create();
    }

    public static Employee createWithDepartment(Department department) {
        return Employee.builder()
            .employeeNumber("EMP001")
            .name("홍길동")
            .department(department)
            .status(EmployeeStatus.ACTIVE)
            .build();
    }

    public static CreateEmployeeRequest createRequest() {
        return CreateEmployeeRequest.builder()
            .employeeNumber("EMP001")
            .name("홍길동")
            .departmentId(1L)
            .build();
    }
}
```

### 3.5 테스트 실행

```bash
# 전체 테스트
./gradlew test

# 특정 모듈 테스트
./gradlew :services:employee-service:test

# 특정 클래스 테스트
./gradlew test --tests "EmployeeServiceTest"

# 통합 테스트만
./gradlew integrationTest

# 커버리지 리포트
./gradlew jacocoTestReport
# 결과: build/reports/jacoco/test/html/index.html
```

### 3.6 테스트 커버리지 목표

| 계층 | 커버리지 목표 |
|------|--------------|
| Domain (Entity/VO) | 90% |
| Application (Service) | 80% |
| Adapter (Controller) | 70% |
| 전체 | 80% |

---

## 4. Git 워크플로우

### 4.1 브랜치 전략 (Git Flow)

```
main                    # 운영 배포 브랜치
  └── develop           # 개발 통합 브랜치
       ├── feature/*    # 기능 개발
       ├── bugfix/*     # 버그 수정
       └── hotfix/*     # 긴급 수정
```

### 4.2 브랜치 네이밍

```
feature/HRPLAT-123-add-employee-search
bugfix/HRPLAT-456-fix-login-error
hotfix/HRPLAT-789-security-patch
release/v1.2.0
```

### 4.3 커밋 메시지 규칙

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type
| Type | 용도 |
|------|------|
| feat | 새로운 기능 |
| fix | 버그 수정 |
| docs | 문서 변경 |
| style | 코드 포맷팅 |
| refactor | 리팩토링 |
| test | 테스트 추가/수정 |
| chore | 빌드/설정 변경 |

#### 예시
```
feat(employee): 직원 검색 기능 추가

- QueryDSL 기반 동적 검색 구현
- 이름, 부서, 입사일 기준 검색 지원
- 페이지네이션 적용

Closes HRPLAT-123
```

### 4.4 Pull Request 규칙

#### PR 제목
```
[HRPLAT-123] feat(employee): 직원 검색 기능 추가
```

#### PR 템플릿
```markdown
## 변경 사항
- 변경 내용 1
- 변경 내용 2

## 테스트 방법
1. 로컬 서버 실행
2. API 호출: GET /api/v1/employees?name=홍길동
3. 응답 확인

## 체크리스트
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] API 문서 업데이트
- [ ] 코드 리뷰 요청
```

---

## 5. 디버깅 가이드

### 5.1 로그 확인

```bash
# 서비스 로그 (실시간)
./gradlew :services:employee-service:bootRun --console=plain

# Docker 컨테이너 로그
docker logs -f hr-postgres
docker logs -f hr-kafka

# Kafka 토픽 메시지 확인
docker exec -it hr-kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic employee-events \
  --from-beginning
```

### 5.2 분산 추적 (Jaeger)

```
1. http://localhost:16686 접속
2. Service 선택: employee-service
3. Find Traces 클릭
4. 특정 요청의 전체 흐름 확인
```

### 5.3 Redis 디버깅

```bash
# Redis CLI 접속
docker exec -it hr-redis redis-cli

# 키 조회
KEYS *
KEYS tenant:*
KEYS employee:*

# 값 확인
GET "tenant:config:tenant-001"
HGETALL "employee:1"

# TTL 확인
TTL "session:abc123"
```

### 5.4 PostgreSQL 디버깅

```sql
-- 현재 연결 확인
SELECT * FROM pg_stat_activity WHERE datname = 'hr_platform';

-- 느린 쿼리 확인
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'employee';

-- 현재 테넌트 설정 확인
SELECT current_setting('app.current_tenant', true);
```

### 5.5 Actuator 엔드포인트

```bash
# 헬스 체크
curl http://localhost:8084/actuator/health

# 메트릭 조회
curl http://localhost:8084/actuator/metrics
curl http://localhost:8084/actuator/metrics/jvm.memory.used

# 환경 정보
curl http://localhost:8084/actuator/env

# 빈 목록
curl http://localhost:8084/actuator/beans
```

### 5.6 IDE 디버깅 설정

#### Remote Debug (IntelliJ)
```
Run > Edit Configurations > Add New > Remote JVM Debug
- Name: Employee Service Debug
- Host: localhost
- Port: 5005

# 서비스 실행 (디버그 모드)
./gradlew :services:employee-service:bootRun --debug-jvm
```

#### 조건부 브레이크포인트
```
우클릭 브레이크포인트 > Condition:
tenantId.equals("problem-tenant")
```

---

## 부록

### A. 자주 사용하는 Gradle 명령어

```bash
# 빌드
./gradlew build                    # 전체 빌드
./gradlew build -x test            # 테스트 제외 빌드
./gradlew :services:auth-service:build  # 특정 모듈만

# 실행
./gradlew bootRun                  # 기본 실행
./gradlew bootRun --args='--spring.profiles.active=local'

# 의존성
./gradlew dependencies             # 전체 의존성 트리
./gradlew :services:employee-service:dependencies --configuration runtimeClasspath

# 캐시 정리
./gradlew clean
./gradlew --refresh-dependencies
```

### B. 유용한 Docker 명령어

```bash
# 전체 재시작
docker-compose down && docker-compose up -d

# 볼륨 포함 삭제 (데이터 초기화)
docker-compose down -v

# 특정 서비스만 재시작
docker-compose restart postgres

# 리소스 사용량 확인
docker stats
```

### C. 트러블슈팅

#### PostgreSQL 연결 실패
```
1. Docker 컨테이너 상태 확인: docker ps
2. 포트 충돌 확인: netstat -ano | findstr 5432
3. 방화벽 확인
4. application.yml 설정 확인
```

#### Kafka 연결 실패
```
1. Zookeeper 상태 확인
2. 토픽 존재 여부: kafka-topics.sh --list
3. 네트워크 설정 (advertised.listeners)
```

#### Redis 연결 실패
```
1. Redis 서버 상태: redis-cli ping
2. 메모리 사용량 확인: redis-cli INFO memory
3. maxmemory 정책 확인
```
