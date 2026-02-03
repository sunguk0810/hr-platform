# Project Structure - HR SaaS Platform

**Document Version**: 1.0
**Created**: 2025-02-03

---

## 1. Directory Structure

```
hr-platform/
├── CLAUDE.md                   # Project context for AI assistants
├── README.md                   # Project overview
├── build.gradle                # Root build configuration
├── settings.gradle             # Module definitions
├── gradle.properties           # Gradle properties
├── gradlew                     # Gradle wrapper (Unix)
├── gradlew.bat                 # Gradle wrapper (Windows)
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
│
├── docker/                     # Docker configurations
│   ├── docker-compose.yml      # Local dev environment
│   ├── docker-compose.prod.yml # Production-like environment
│   ├── .env.example            # Environment variables template
│   ├── postgres/
│   │   ├── init.sql            # Database initialization
│   │   └── postgresql.conf     # PostgreSQL configuration
│   ├── keycloak/
│   │   └── realm-export.json   # Keycloak realm configuration
│   ├── prometheus/
│   │   └── prometheus.yml      # Prometheus configuration
│   └── grafana/
│       └── provisioning/
│           ├── dashboards/
│           └── datasources/
│
├── config/                     # Centralized configuration files
│   ├── application.yml         # Common configuration
│   ├── application-local.yml   # Local environment
│   ├── application-dev.yml     # Development environment
│   └── application-prod.yml    # Production environment
│
├── common/                     # Shared modules
│   ├── common-core/
│   │   ├── build.gradle
│   │   └── src/main/java/com/hrsaas/common/core/
│   ├── common-entity/
│   │   ├── build.gradle
│   │   └── src/main/java/com/hrsaas/common/entity/
│   ├── common-response/
│   │   ├── build.gradle
│   │   └── src/main/java/com/hrsaas/common/response/
│   ├── common-database/
│   │   ├── build.gradle
│   │   └── src/main/java/com/hrsaas/common/database/
│   ├── common-tenant/
│   │   ├── build.gradle
│   │   └── src/main/java/com/hrsaas/common/tenant/
│   ├── common-security/
│   │   ├── build.gradle
│   │   └── src/main/java/com/hrsaas/common/security/
│   ├── common-privacy/
│   │   ├── build.gradle
│   │   └── src/main/java/com/hrsaas/common/privacy/
│   ├── common-cache/
│   │   ├── build.gradle
│   │   └── src/main/java/com/hrsaas/common/cache/
│   └── common-event/
│       ├── build.gradle
│       └── src/main/java/com/hrsaas/common/event/
│
├── services/                   # Microservices
│   ├── gateway-service/        # API Gateway (Port 8080)
│   ├── auth-service/           # Authentication (Port 8081)
│   ├── tenant-service/         # Multi-tenancy (Port 8082)
│   ├── organization-service/   # Organization (Port 8083)
│   ├── employee-service/       # Employee (Port 8084)
│   ├── attendance-service/     # Attendance (Port 8085)
│   ├── approval-service/       # Workflow (Port 8086)
│   ├── mdm-service/            # Master Data (Port 8087)
│   ├── notification-service/   # Notifications (Port 8088)
│   └── file-service/           # File Management (Port 8089)
│
├── infra/                      # Infrastructure services
│   └── config-server/          # Spring Cloud Config (Port 8888)
│
├── scripts/                    # Utility scripts
│   ├── start-local.sh          # Start local environment
│   ├── stop-local.sh           # Stop local environment
│   ├── build-all.sh            # Build all modules
│   └── init-db.sh              # Initialize database
│
└── docs/                       # Documentation
    ├── PRD.md                  # Product Requirements
    ├── SDD_*.md                # Software Design Documents
    ├── API_CONVENTIONS.md      # API guidelines
    └── DEVELOPMENT_GUIDE.md    # Development guide
```

---

## 2. Service Structure (Per Service)

Each microservice follows a consistent structure:

```
{service-name}/
├── build.gradle
├── Dockerfile
├── src/
│   ├── main/
│   │   ├── java/com/hrsaas/{service}/
│   │   │   ├── {Service}Application.java
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── WebConfig.java
│   │   │   │   └── KafkaConfig.java
│   │   │   ├── controller/
│   │   │   │   ├── {Resource}Controller.java
│   │   │   │   └── InternalController.java
│   │   │   ├── service/
│   │   │   │   ├── {Resource}Service.java
│   │   │   │   └── impl/
│   │   │   │       └── {Resource}ServiceImpl.java
│   │   │   ├── repository/
│   │   │   │   └── {Resource}Repository.java
│   │   │   ├── domain/
│   │   │   │   ├── entity/
│   │   │   │   │   └── {Resource}.java
│   │   │   │   ├── dto/
│   │   │   │   │   ├── request/
│   │   │   │   │   │   └── {Resource}CreateRequest.java
│   │   │   │   │   └── response/
│   │   │   │   │       └── {Resource}Response.java
│   │   │   │   └── event/
│   │   │   │       └── {Resource}CreatedEvent.java
│   │   │   ├── client/
│   │   │   │   └── {External}ServiceClient.java
│   │   │   └── infrastructure/
│   │   │       └── external/
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-local.yml
│   │       ├── bootstrap.yml
│   │       └── db/migration/
│   │           ├── V1__create_tables.sql
│   │           └── V2__add_indexes.sql
│   └── test/
│       ├── java/com/hrsaas/{service}/
│       │   ├── controller/
│       │   │   └── {Resource}ControllerTest.java
│       │   ├── service/
│       │   │   └── {Resource}ServiceTest.java
│       │   └── integration/
│       │       └── {Resource}IntegrationTest.java
│       └── resources/
│           └── application-test.yml
```

---

## 3. Root Build Configuration

### 3.1 settings.gradle

```gradle
rootProject.name = 'hr-platform'

// Common modules
include 'common:common-core'
include 'common:common-entity'
include 'common:common-response'
include 'common:common-database'
include 'common:common-tenant'
include 'common:common-security'
include 'common:common-privacy'
include 'common:common-cache'
include 'common:common-event'

// Infrastructure
include 'infra:config-server'

// Services
include 'services:gateway-service'
include 'services:auth-service'
include 'services:tenant-service'
include 'services:organization-service'
include 'services:employee-service'
include 'services:attendance-service'
include 'services:approval-service'
include 'services:mdm-service'
include 'services:notification-service'
include 'services:file-service'
```

### 3.2 build.gradle (Root)

```gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.2.2' apply false
    id 'io.spring.dependency-management' version '1.1.4' apply false
    id 'jacoco'
}

ext {
    set('springCloudVersion', '2023.0.0')
    set('testcontainersVersion', '1.19.3')
    set('queryDslVersion', '5.0.0')
}

allprojects {
    group = 'com.hrsaas'
    version = '1.0.0-SNAPSHOT'

    repositories {
        mavenCentral()
    }
}

subprojects {
    apply plugin: 'java'
    apply plugin: 'jacoco'

    java {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    configurations {
        compileOnly {
            extendsFrom annotationProcessor
        }
    }

    dependencies {
        compileOnly 'org.projectlombok:lombok'
        annotationProcessor 'org.projectlombok:lombok'

        testImplementation 'org.junit.jupiter:junit-jupiter'
        testImplementation 'org.assertj:assertj-core'
        testImplementation 'org.mockito:mockito-core'
        testImplementation 'org.mockito:mockito-junit-jupiter'
    }

    test {
        useJUnitPlatform()
        finalizedBy jacocoTestReport
    }

    jacocoTestReport {
        dependsOn test
        reports {
            xml.required = true
            html.required = true
        }
    }

    jacocoTestCoverageVerification {
        violationRules {
            rule {
                limit {
                    minimum = 0.8
                }
            }
        }
    }
}

// Configure Spring Boot projects
configure(subprojects.findAll { it.name.endsWith('-service') || it.name == 'config-server' }) {
    apply plugin: 'org.springframework.boot'
    apply plugin: 'io.spring.dependency-management'

    dependencyManagement {
        imports {
            mavenBom "org.springframework.cloud:spring-cloud-dependencies:${springCloudVersion}"
            mavenBom "org.testcontainers:testcontainers-bom:${testcontainersVersion}"
        }
    }

    dependencies {
        implementation 'org.springframework.boot:spring-boot-starter-actuator'
        implementation 'io.micrometer:micrometer-registry-prometheus'
        implementation 'io.micrometer:micrometer-tracing-bridge-otel'
        implementation 'io.opentelemetry:opentelemetry-exporter-otlp'

        testImplementation 'org.springframework.boot:spring-boot-starter-test'
    }

    bootJar {
        archiveFileName = "${project.name}.jar"
    }
}

// Configure library projects (common modules)
configure(subprojects.findAll { it.path.startsWith(':common:') }) {
    apply plugin: 'java-library'
    apply plugin: 'io.spring.dependency-management'

    dependencyManagement {
        imports {
            mavenBom "org.springframework.boot:spring-boot-dependencies:3.2.2"
        }
    }

    // Disable bootJar for library projects
    if (plugins.hasPlugin('org.springframework.boot')) {
        bootJar {
            enabled = false
        }
        jar {
            enabled = true
        }
    }
}
```

---

## 4. Module Dependencies

### 4.1 Dependency Matrix

| Module | Dependencies |
|--------|--------------|
| common-core | (none) |
| common-entity | common-core |
| common-response | common-core |
| common-database | common-entity |
| common-tenant | common-core |
| common-security | common-core, common-tenant |
| common-privacy | common-core |
| common-cache | common-core, common-tenant |
| common-event | common-core |

### 4.2 Service Dependencies

| Service | Common Modules | Service Dependencies |
|---------|---------------|---------------------|
| gateway-service | common-core, common-response | - |
| auth-service | all | tenant-service (Feign) |
| tenant-service | all | - |
| organization-service | all | tenant-service (Feign) |
| employee-service | all | tenant-service, organization-service, auth-service (Feign) |
| attendance-service | all | tenant-service, employee-service, approval-service (Feign) |
| approval-service | all | tenant-service, organization-service, employee-service (Feign) |
| mdm-service | all | tenant-service (Feign) |
| notification-service | all | employee-service (Feign) |
| file-service | all | - |

---

## 5. Service Build Configurations

### 5.1 Gateway Service (build.gradle)

```gradle
dependencies {
    implementation project(':common:common-core')
    implementation project(':common:common-response')

    implementation 'org.springframework.cloud:spring-cloud-starter-gateway'
    implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server'
    implementation 'org.springframework.boot:spring-boot-starter-data-redis-reactive'
    implementation 'org.springframework.cloud:spring-cloud-starter-circuitbreaker-reactor-resilience4j'
}
```

### 5.2 Standard Service (build.gradle)

```gradle
// Example: employee-service/build.gradle
dependencies {
    // Common modules
    implementation project(':common:common-core')
    implementation project(':common:common-entity')
    implementation project(':common:common-response')
    implementation project(':common:common-database')
    implementation project(':common:common-tenant')
    implementation project(':common:common-security')
    implementation project(':common:common-privacy')
    implementation project(':common:common-cache')
    implementation project(':common:common-event')

    // Spring Boot
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server'
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'

    // Spring Cloud
    implementation 'org.springframework.cloud:spring-cloud-starter-config'
    implementation 'org.springframework.cloud:spring-cloud-starter-openfeign'
    implementation 'org.springframework.cloud:spring-cloud-starter-circuitbreaker-resilience4j'

    // Kafka
    implementation 'org.springframework.kafka:spring-kafka'

    // Database
    runtimeOnly 'org.postgresql:postgresql'
    implementation 'org.flywaydb:flyway-core'
    implementation 'org.flywaydb:flyway-database-postgresql'

    // Documentation
    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.3.0'

    // Testing
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.security:spring-security-test'
    testImplementation 'org.testcontainers:postgresql'
    testImplementation 'org.testcontainers:kafka'
    testImplementation 'org.testcontainers:junit-jupiter'
}
```

### 5.3 Common Module (build.gradle)

```gradle
// Example: common-entity/build.gradle
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

## 6. Docker Configuration

### 6.1 docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: hr-saas-postgres
    environment:
      POSTGRES_USER: hr_saas
      POSTGRES_PASSWORD: hr_saas_password
      POSTGRES_DB: hr_saas
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hr_saas"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - hr-saas-network

  redis:
    image: redis:7-alpine
    container_name: hr-saas-redis
    command: redis-server --requirepass redis_password
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "redis_password", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - hr-saas-network

  kafka:
    image: bitnami/kafka:3.5
    container_name: hr-saas-kafka
    environment:
      - KAFKA_CFG_NODE_ID=0
      - KAFKA_CFG_PROCESS_ROLES=controller,broker
      - KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093
      - KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      - KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=0@kafka:9093
      - KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER
      - KAFKA_CFG_AUTO_CREATE_TOPICS_ENABLE=true
      - KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092
    ports:
      - "9092:9092"
    volumes:
      - kafka_data:/bitnami/kafka
    healthcheck:
      test: ["CMD-SHELL", "kafka-topics.sh --bootstrap-server localhost:9092 --list"]
      interval: 30s
      timeout: 10s
      retries: 5
    networks:
      - hr-saas-network

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: hr-saas-kafka-ui
    environment:
      - KAFKA_CLUSTERS_0_NAME=local
      - KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS=kafka:9092
    ports:
      - "8090:8080"
    depends_on:
      - kafka
    networks:
      - hr-saas-network

  keycloak:
    image: quay.io/keycloak/keycloak:23.0
    container_name: hr-saas-keycloak
    command: start-dev --import-realm
    environment:
      - KEYCLOAK_ADMIN=admin
      - KEYCLOAK_ADMIN_PASSWORD=admin
      - KC_DB=postgres
      - KC_DB_URL=jdbc:postgresql://postgres:5432/keycloak
      - KC_DB_USERNAME=hr_saas
      - KC_DB_PASSWORD=hr_saas_password
    ports:
      - "8180:8080"
    volumes:
      - ./keycloak/realm-export.json:/opt/keycloak/data/import/realm-export.json
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - hr-saas-network

  jaeger:
    image: jaegertracing/all-in-one:1.52
    container_name: hr-saas-jaeger
    environment:
      - COLLECTOR_OTLP_ENABLED=true
    ports:
      - "16686:16686"
      - "4317:4317"
      - "4318:4318"
    networks:
      - hr-saas-network

  prometheus:
    image: prom/prometheus:v2.48.0
    container_name: hr-saas-prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - hr-saas-network

  grafana:
    image: grafana/grafana:10.2.0
    container_name: hr-saas-grafana
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    depends_on:
      - prometheus
    networks:
      - hr-saas-network

volumes:
  postgres_data:
  redis_data:
  kafka_data:
  prometheus_data:
  grafana_data:

networks:
  hr-saas-network:
    name: hr-saas-network
```

### 6.2 Database Initialization (init.sql)

```sql
-- Create database for Keycloak
CREATE DATABASE keycloak;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS tenant_common;
CREATE SCHEMA IF NOT EXISTS hr_core;
CREATE SCHEMA IF NOT EXISTS hr_attendance;
CREATE SCHEMA IF NOT EXISTS hr_approval;
CREATE SCHEMA IF NOT EXISTS hr_audit;

-- Grant privileges
GRANT ALL PRIVILEGES ON SCHEMA tenant_common TO hr_saas;
GRANT ALL PRIVILEGES ON SCHEMA hr_core TO hr_saas;
GRANT ALL PRIVILEGES ON SCHEMA hr_attendance TO hr_saas;
GRANT ALL PRIVILEGES ON SCHEMA hr_approval TO hr_saas;
GRANT ALL PRIVILEGES ON SCHEMA hr_audit TO hr_saas;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function for setting tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant', tenant_uuid::TEXT, false);
END;
$$ LANGUAGE plpgsql;

-- Function for getting current tenant
CREATE OR REPLACE FUNCTION get_current_tenant()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_tenant', true)::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

---

## 7. Configuration Files

### 7.1 Common Application Configuration (config/application.yml)

```yaml
spring:
  profiles:
    active: local

  jackson:
    serialization:
      write-dates-as-timestamps: false
    deserialization:
      fail-on-unknown-properties: false
    default-property-inclusion: non_null
    time-zone: Asia/Seoul

  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
    properties:
      hibernate:
        default_schema: public
        format_sql: true
        jdbc:
          batch_size: 50
        order_inserts: true
        order_updates: true

  data:
    redis:
      timeout: 5000ms

  kafka:
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
    consumer:
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      auto-offset-reset: earliest
      properties:
        spring.json.trusted.packages: com.hrsaas.*

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when_authorized
  tracing:
    sampling:
      probability: 1.0

logging:
  level:
    root: INFO
    com.hrsaas: DEBUG
    org.springframework.security: DEBUG
```

### 7.2 Local Environment (config/application-local.yml)

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/hr_saas
    username: hr_saas
    password: hr_saas_password
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5

  data:
    redis:
      host: localhost
      port: 6379
      password: redis_password

  kafka:
    bootstrap-servers: localhost:9092

  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8180/realms/hr-saas

  jpa:
    show-sql: true

management:
  otlp:
    tracing:
      endpoint: http://localhost:4318/v1/traces

app:
  encryption:
    key: ${ENCRYPTION_KEY:c29tZS1zZWNyZXQta2V5LWZvci1lbmNyeXB0aW9u}
```

---

## 8. Service Dockerfile Template

```dockerfile
# Build stage
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /workspace/app

COPY ../gradle gradle
COPY ../gradlew .
COPY ../build.gradle settings.gradle ./
COPY ../common common
COPY ../services services

RUN chmod +x gradlew
RUN ./gradlew :services:{service-name}:build -x test --no-daemon

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy JAR
COPY --from=build /workspace/app/services/{service-name}/build/libs/{service-name}.jar app.jar

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

# JVM options
ENV JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC -XX:MaxGCPauseMillis=100"

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

---

## 9. Utility Scripts

### 9.1 start-local.sh

```bash
#!/bin/bash

echo "Starting HR SaaS Local Environment..."

# Start Docker Compose
cd docker
docker-compose up -d

echo "Waiting for services to be ready..."

# Wait for PostgreSQL
until docker exec hr-saas-postgres pg_isready -U hr_saas; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done
echo "PostgreSQL is ready"

# Wait for Redis
until docker exec hr-saas-redis redis-cli -a redis_password ping | grep PONG; do
    echo "Waiting for Redis..."
    sleep 2
done
echo "Redis is ready"

# Wait for Kafka
sleep 10
echo "Kafka is ready"

# Wait for Keycloak
until curl -s http://localhost:8180/realms/master > /dev/null 2>&1; do
    echo "Waiting for Keycloak..."
    sleep 5
done
echo "Keycloak is ready"

echo ""
echo "All services are ready!"
echo ""
echo "Service URLs:"
echo "  - PostgreSQL:  localhost:5432"
echo "  - Redis:       localhost:6379"
echo "  - Kafka:       localhost:9092"
echo "  - Kafka UI:    http://localhost:8090"
echo "  - Keycloak:    http://localhost:8180 (admin/admin)"
echo "  - Jaeger:      http://localhost:16686"
echo "  - Prometheus:  http://localhost:9090"
echo "  - Grafana:     http://localhost:3000 (admin/admin)"
```

### 9.2 build-all.sh

```bash
#!/bin/bash

echo "Building all modules..."

./gradlew clean build -x test --parallel

echo "Build complete!"
```

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-02-03 | - | Initial creation |

---

**End of Document**
