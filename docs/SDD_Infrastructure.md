# Infrastructure - Software Design Document (SDD)

**문서 버전**: 1.0  
**작성일**: 2025-02-03  
**서비스명**: Infrastructure  

---

## 목차

1. [개요](#1-개요)
2. [AWS 아키텍처](#2-aws-아키텍처)
3. [Kubernetes (EKS) 구성](#3-kubernetes-eks-구성)
4. [네트워크 설계](#4-네트워크-설계)
5. [데이터베이스 설계](#5-데이터베이스-설계)
6. [캐시 및 메시징](#6-캐시-및-메시징)
7. [CI/CD 파이프라인](#7-cicd-파이프라인)
8. [모니터링 및 로깅](#8-모니터링-및-로깅)
9. [보안](#9-보안)
10. [로컬 개발 환경](#10-로컬-개발-환경)
11. [비용 최적화](#11-비용-최적화)

---

## 1. 개요

### 1.1 인프라 목표

- **가용성**: 99.9% SLA 달성
- **확장성**: 10,000 동시 접속자, 100+ 테넌트 지원
- **보안**: PIPA/ISMS 규정 준수
- **비용 효율**: 개발/운영 환경 분리, 자동 스케일링

### 1.2 환경 구성

| 환경 | 용도 | 특징 |
|------|------|------|
| **Local** | 개발자 로컬 환경 | Docker Compose, 단일 머신 |
| **Dev** | 개발/테스트 | AWS (최소 리소스), 야간/주말 자동 중지 |
| **Production** | 운영 | AWS (HA 구성), Auto Scaling |

### 1.3 리전 정책

- **데이터 보관**: 한국 리전(ap-northeast-2) 전용
- **DR(재해복구)**: 동일 리전 내 Multi-AZ

---

## 2. AWS 아키텍처

### 2.1 전체 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 AWS Cloud                                    │
│                            Region: ap-northeast-2                            │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                              VPC (10.0.0.0/16)                          │  │
│  │                                                                         │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    Public Subnets (10.0.1.0/24, 10.0.2.0/24)     │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │  │  │
│  │  │  │     ALB     │  │   NAT GW    │  │       Bastion Host      │ │  │  │
│  │  │  │  (Ingress)  │  │   (AZ-a/b)  │  │                         │ │  │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────────┘ │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                    │                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                   Private Subnets (10.0.10.0/24, 10.0.20.0/24)   │  │  │
│  │  │                                                                   │  │  │
│  │  │  ┌─────────────────────────────────────────────────────────┐    │  │  │
│  │  │  │                    EKS Cluster                           │    │  │  │
│  │  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │    │  │  │
│  │  │  │  │ gateway  │ │   auth   │ │  tenant  │ │   org    │  │    │  │  │
│  │  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │    │  │  │
│  │  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │    │  │  │
│  │  │  │  │ employee │ │attendance│ │ approval │ │   mdm    │  │    │  │  │
│  │  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │    │  │  │
│  │  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐               │    │  │  │
│  │  │  │  │  notif   │ │   file   │ │ keycloak │               │    │  │  │
│  │  │  │  └──────────┘ └──────────┘ └──────────┘               │    │  │  │
│  │  │  └─────────────────────────────────────────────────────────┘    │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                    │                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                   Data Subnets (10.0.100.0/24, 10.0.200.0/24)    │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │  │  │
│  │  │  │ PostgreSQL  │  │    Redis    │  │         MSK             │ │  │  │
│  │  │  │    RDS      │  │ ElastiCache │  │       (Kafka)           │ │  │  │
│  │  │  │  (Multi-AZ) │  │  (Cluster)  │  │                         │ │  │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────────┘ │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────┐  ┌───────────────────────┐                       │
│  │         S3            │  │      CloudWatch       │                       │
│  │   (Files, Logs)       │  │    (Logs, Metrics)    │                       │
│  └───────────────────────┘  └───────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 AWS 서비스 목록

| 서비스 | 용도 | 환경별 구성 |
|--------|------|------------|
| **EKS** | Kubernetes 클러스터 | Dev: 2 노드 / Prod: 3+ 노드 (Auto Scaling) |
| **RDS PostgreSQL** | 메인 데이터베이스 | Dev: db.t3.medium / Prod: db.r6g.xlarge (Multi-AZ) |
| **ElastiCache Redis** | 캐시, 세션, 분산락 | Dev: cache.t3.micro / Prod: cache.r6g.large (Cluster) |
| **MSK (Kafka)** | 이벤트 스트리밍 | Dev: kafka.t3.small / Prod: kafka.m5.large |
| **S3** | 파일 저장소, 로그 | Standard + Intelligent-Tiering |
| **ALB** | 로드 밸런서 | HTTPS 종료, WAF 연동 준비 |
| **CloudWatch** | 로그, 메트릭 | 로그 보관 30일 (Dev) / 1년 (Prod) |
| **Secrets Manager** | 민감 정보 관리 | DB 비밀번호, API 키 |
| **KMS** | 암호화 키 관리 | RDS, S3, Secrets 암호화 |
| **CodePipeline** | CI/CD | 자동 배포 파이프라인 |

---

## 3. Kubernetes (EKS) 구성

### 3.1 클러스터 설정

```yaml
# eks-cluster.yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: hr-saas-cluster
  region: ap-northeast-2
  version: "1.28"

vpc:
  cidr: 10.0.0.0/16
  nat:
    gateway: HighlyAvailable  # Prod
    # gateway: Single         # Dev

managedNodeGroups:
  - name: app-nodes
    instanceType: m5.large    # Prod
    # instanceType: t3.medium # Dev
    desiredCapacity: 3
    minSize: 2
    maxSize: 10
    volumeSize: 100
    volumeType: gp3
    labels:
      role: application
    tags:
      Environment: production
      
  - name: spot-nodes          # 비용 최적화용 Spot 인스턴스
    instanceTypes:
      - m5.large
      - m5a.large
      - m4.large
    spot: true
    desiredCapacity: 2
    minSize: 0
    maxSize: 5
    labels:
      role: spot
    taints:
      - key: spot
        value: "true"
        effect: PreferNoSchedule

addons:
  - name: vpc-cni
  - name: coredns
  - name: kube-proxy
  - name: aws-ebs-csi-driver
```

### 3.2 네임스페이스 구조

```
hr-saas-cluster
├── hr-saas-system          # 애플리케이션 서비스
│   ├── gateway-service
│   ├── auth-service
│   ├── tenant-service
│   ├── organization-service
│   ├── employee-service
│   ├── attendance-service
│   ├── approval-service
│   ├── mdm-service
│   ├── notification-service
│   └── file-service
├── hr-saas-infra           # 인프라 서비스
│   ├── keycloak
│   ├── config-server
│   └── schema-registry
├── monitoring              # 모니터링
│   ├── prometheus
│   ├── grafana
│   ├── jaeger
│   └── fluentbit
└── kube-system             # 시스템 컴포넌트
```

### 3.3 Deployment 템플릿

```yaml
# deployment-template.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${SERVICE_NAME}
  namespace: hr-saas-system
  labels:
    app: ${SERVICE_NAME}
    version: ${VERSION}
spec:
  replicas: 3  # Prod: 3, Dev: 1
  selector:
    matchLabels:
      app: ${SERVICE_NAME}
  template:
    metadata:
      labels:
        app: ${SERVICE_NAME}
        version: ${VERSION}
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/actuator/prometheus"
    spec:
      serviceAccountName: ${SERVICE_NAME}
      containers:
        - name: ${SERVICE_NAME}
          image: ${ECR_REGISTRY}/${SERVICE_NAME}:${VERSION}
          ports:
            - containerPort: 8080
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: "${ENVIRONMENT}"
            - name: JAVA_OPTS
              value: "-Xms512m -Xmx1024m -XX:+UseG1GC"
          envFrom:
            - configMapRef:
                name: ${SERVICE_NAME}-config
            - secretRef:
                name: ${SERVICE_NAME}-secrets
          resources:
            requests:
              cpu: "250m"
              memory: "512Mi"
            limits:
              cpu: "1000m"
              memory: "1536Mi"
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 60
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 5
          lifecycle:
            preStop:
              exec:
                command: ["sh", "-c", "sleep 10"]
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: ${SERVICE_NAME}
                topologyKey: kubernetes.io/hostname
```

### 3.4 Service 및 Ingress

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: ${SERVICE_NAME}
  namespace: hr-saas-system
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 8080
  selector:
    app: ${SERVICE_NAME}

---
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hr-saas-ingress
  namespace: hr-saas-system
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: ${ACM_CERT_ARN}
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
    alb.ingress.kubernetes.io/ssl-redirect: '443'
    alb.ingress.kubernetes.io/healthcheck-path: /actuator/health
spec:
  rules:
    - host: api.hr-saas.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: gateway-service
                port:
                  number: 80
    - host: auth.hr-saas.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: keycloak
                port:
                  number: 80
```

### 3.5 Horizontal Pod Autoscaler

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${SERVICE_NAME}-hpa
  namespace: hr-saas-system
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${SERVICE_NAME}
  minReplicas: 2      # Prod: 2, Dev: 1
  maxReplicas: 10     # Prod: 10, Dev: 3
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
```

---

## 4. 네트워크 설계

### 4.1 VPC 구성

| 구분 | CIDR | 용도 |
|------|------|------|
| VPC | 10.0.0.0/16 | 전체 네트워크 |
| Public Subnet AZ-a | 10.0.1.0/24 | ALB, NAT Gateway, Bastion |
| Public Subnet AZ-b | 10.0.2.0/24 | ALB, NAT Gateway |
| Private Subnet AZ-a | 10.0.10.0/24 | EKS Worker Nodes |
| Private Subnet AZ-b | 10.0.20.0/24 | EKS Worker Nodes |
| Data Subnet AZ-a | 10.0.100.0/24 | RDS, ElastiCache, MSK |
| Data Subnet AZ-b | 10.0.200.0/24 | RDS, ElastiCache, MSK |

### 4.2 Security Groups

```hcl
# EKS Worker Nodes
resource "aws_security_group" "eks_workers" {
  name        = "eks-workers-sg"
  description = "EKS Worker Nodes Security Group"
  vpc_id      = aws_vpc.main.id

  # 내부 통신
  ingress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    self      = true
  }

  # ALB에서 트래픽
  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # 외부 통신 (NAT Gateway 통해)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# RDS
resource "aws_security_group" "rds" {
  name        = "rds-sg"
  description = "RDS Security Group"
  vpc_id      = aws_vpc.main.id

  # EKS에서만 접근
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_workers.id]
  }
}

# Redis
resource "aws_security_group" "redis" {
  name        = "redis-sg"
  description = "Redis Security Group"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_workers.id]
  }
}

# Kafka (MSK)
resource "aws_security_group" "msk" {
  name        = "msk-sg"
  description = "MSK Security Group"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 9092
    to_port         = 9098
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_workers.id]
  }
}
```

---

## 5. 데이터베이스 설계

### 5.1 RDS PostgreSQL 구성

```hcl
# RDS Instance
resource "aws_db_instance" "main" {
  identifier     = "hr-saas-db"
  engine         = "postgres"
  engine_version = "15.4"
  
  # 인스턴스 크기
  instance_class = "db.r6g.xlarge"  # Prod
  # instance_class = "db.t3.medium"  # Dev
  
  # 스토리지
  allocated_storage     = 100
  max_allocated_storage = 500
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds.arn
  
  # 네트워크
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  
  # 고가용성
  multi_az = true  # Prod only
  
  # 백업
  backup_retention_period = 30
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"
  
  # 파라미터
  parameter_group_name = aws_db_parameter_group.main.name
  
  # 모니터링
  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn
  
  # 삭제 보호
  deletion_protection = true  # Prod only
  skip_final_snapshot = false
  
  tags = {
    Environment = "production"
    Name        = "hr-saas-db"
  }
}

# Read Replica (Prod only)
resource "aws_db_instance" "replica" {
  count = var.environment == "production" ? 1 : 0
  
  identifier          = "hr-saas-db-replica"
  replicate_source_db = aws_db_instance.main.identifier
  instance_class      = "db.r6g.large"
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  
  # 복제본 설정
  auto_minor_version_upgrade = true
  
  tags = {
    Environment = "production"
    Name        = "hr-saas-db-replica"
  }
}
```

### 5.2 데이터베이스 파라미터

```hcl
resource "aws_db_parameter_group" "main" {
  family = "postgres15"
  name   = "hr-saas-pg15"

  # 연결 설정
  parameter {
    name  = "max_connections"
    value = "500"
  }

  # 메모리 설정
  parameter {
    name  = "shared_buffers"
    value = "{DBInstanceClassMemory/4}"
  }
  
  parameter {
    name  = "effective_cache_size"
    value = "{DBInstanceClassMemory*3/4}"
  }

  # Row Level Security
  parameter {
    name  = "row_security"
    value = "on"
  }

  # 로깅
  parameter {
    name  = "log_statement"
    value = "ddl"
  }
  
  parameter {
    name  = "log_min_duration_statement"
    value = "1000"  # 1초 이상 쿼리 로깅
  }

  # 한국어 설정
  parameter {
    name  = "lc_messages"
    value = "en_US.UTF-8"
  }
}
```

### 5.3 스키마 분리 전략

```sql
-- 스키마 생성
CREATE SCHEMA IF NOT EXISTS tenant_common;  -- 테넌트 공통 (테넌트 정보, 공통코드)
CREATE SCHEMA IF NOT EXISTS hr_core;        -- HR 핵심 (조직, 인사)
CREATE SCHEMA IF NOT EXISTS hr_attendance;  -- 근태/휴가
CREATE SCHEMA IF NOT EXISTS hr_approval;    -- 전자결재
CREATE SCHEMA IF NOT EXISTS hr_audit;       -- 감사 로그

-- 서비스별 사용자
CREATE USER tenant_service WITH PASSWORD '${TENANT_SERVICE_PASSWORD}';
CREATE USER employee_service WITH PASSWORD '${EMPLOYEE_SERVICE_PASSWORD}';
CREATE USER attendance_service WITH PASSWORD '${ATTENDANCE_SERVICE_PASSWORD}';
CREATE USER approval_service WITH PASSWORD '${APPROVAL_SERVICE_PASSWORD}';

-- 권한 부여
GRANT USAGE ON SCHEMA tenant_common TO tenant_service;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA tenant_common TO tenant_service;

GRANT USAGE ON SCHEMA hr_core TO employee_service;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA hr_core TO employee_service;

-- RLS 활성화 예시
ALTER TABLE hr_core.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON hr_core.employees
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

---

## 6. 캐시 및 메시징

### 6.1 Redis (ElastiCache) 구성

```hcl
resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "hr-saas-redis"
  description          = "HR SaaS Redis Cluster"
  
  # 엔진
  engine               = "redis"
  engine_version       = "7.0"
  parameter_group_name = "default.redis7"
  
  # 노드 타입
  node_type = "cache.r6g.large"  # Prod
  # node_type = "cache.t3.micro"  # Dev
  
  # 클러스터 설정
  num_cache_clusters         = 2  # Prod: 2, Dev: 1
  automatic_failover_enabled = true  # Prod only
  multi_az_enabled           = true  # Prod only
  
  # 네트워크
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]
  
  # 암호화
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = var.redis_auth_token
  
  # 유지보수
  maintenance_window       = "mon:05:00-mon:06:00"
  snapshot_retention_limit = 7
  snapshot_window          = "04:00-05:00"
  
  tags = {
    Environment = "production"
    Name        = "hr-saas-redis"
  }
}
```

### 6.2 Redis 용도별 설정

```yaml
# Spring Boot Redis Configuration
spring:
  data:
    redis:
      host: ${REDIS_HOST}
      port: 6379
      password: ${REDIS_PASSWORD}
      ssl:
        enabled: true
      lettuce:
        pool:
          max-active: 10
          max-idle: 5
          min-idle: 2

# Cache 설정
cache:
  # 테넌트 정보 캐시 (1시간)
  tenant-config:
    ttl: 3600
    prefix: "tenant:config:"
  
  # 사용자 세션 (8시간)
  session:
    ttl: 28800
    prefix: "session:"
  
  # 조직 정보 캐시 (30분)
  organization:
    ttl: 1800
    prefix: "org:"
  
  # 결재선 캐시 (5분)
  approval-line:
    ttl: 300
    prefix: "approval:line:"

# 분산 락 설정
distributed-lock:
  prefix: "lock:"
  default-timeout: 30000  # 30초
  retry-interval: 100     # 100ms
```

### 6.3 Kafka (MSK) 구성

```hcl
resource "aws_msk_cluster" "main" {
  cluster_name           = "hr-saas-kafka"
  kafka_version          = "3.5.1"
  number_of_broker_nodes = 3  # Prod: 3, Dev: 2

  broker_node_group_info {
    instance_type   = "kafka.m5.large"  # Prod
    # instance_type = "kafka.t3.small"  # Dev
    client_subnets  = aws_subnet.data[*].id
    security_groups = [aws_security_group.msk.id]
    
    storage_info {
      ebs_storage_info {
        volume_size = 100
      }
    }
  }

  encryption_info {
    encryption_at_rest_kms_key_arn = aws_kms_key.msk.arn
    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }
  }

  configuration_info {
    arn      = aws_msk_configuration.main.arn
    revision = aws_msk_configuration.main.latest_revision
  }

  logging_info {
    broker_logs {
      cloudwatch_logs {
        enabled   = true
        log_group = aws_cloudwatch_log_group.msk.name
      }
    }
  }

  tags = {
    Environment = "production"
    Name        = "hr-saas-kafka"
  }
}
```

### 6.4 Kafka Topics 설계

```yaml
# Topic 목록
topics:
  # 테넌트 이벤트
  - name: tenant.events
    partitions: 6
    replication-factor: 3
    retention.ms: 604800000  # 7일
    
  # 조직 변경 이벤트
  - name: organization.events
    partitions: 6
    replication-factor: 3
    
  # 직원 정보 이벤트
  - name: employee.events
    partitions: 12
    replication-factor: 3
    
  # 휴가 신청 이벤트
  - name: attendance.leave-requests
    partitions: 6
    replication-factor: 3
    
  # 결재 이벤트
  - name: approval.events
    partitions: 12
    replication-factor: 3
    
  # 알림 이벤트
  - name: notification.events
    partitions: 6
    replication-factor: 3
    
  # 감사 로그
  - name: audit.logs
    partitions: 12
    replication-factor: 3
    retention.ms: 2592000000  # 30일
```

---

## 7. CI/CD 파이프라인

### 7.1 파이프라인 아키텍처

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   GitHub    │───▶│ CodePipeline│───▶│  CodeBuild  │───▶│   ECR       │
│  (Source)   │    │  (Pipeline) │    │   (Build)   │    │  (Registry) │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                │
                                                                ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   EKS       │◀───│ CodeDeploy  │◀───│  CodeBuild  │◀───│   ECR       │
│  (Deploy)   │    │  (Deploy)   │    │  (Deploy)   │    │  (Registry) │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 7.2 CodeBuild 설정

```yaml
# buildspec.yml
version: 0.2

env:
  variables:
    JAVA_VERSION: "17"
    GRADLE_OPTS: "-Dorg.gradle.daemon=false"
  parameter-store:
    DOCKER_USERNAME: /hr-saas/docker/username
    DOCKER_PASSWORD: /hr-saas/docker/password
  secrets-manager:
    SONAR_TOKEN: hr-saas/sonar:token

phases:
  install:
    runtime-versions:
      java: corretto17
      docker: 20
    commands:
      - echo "Installing dependencies..."
      
  pre_build:
    commands:
      - echo "Logging in to ECR..."
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}
      
  build:
    commands:
      - echo "Building application..."
      - ./gradlew clean build -x test
      - echo "Running tests..."
      - ./gradlew test jacocoTestReport
      - echo "Building Docker image..."
      - docker build -t $ECR_REGISTRY/$SERVICE_NAME:$IMAGE_TAG .
      - docker tag $ECR_REGISTRY/$SERVICE_NAME:$IMAGE_TAG $ECR_REGISTRY/$SERVICE_NAME:latest
      
  post_build:
    commands:
      - echo "Pushing Docker image..."
      - docker push $ECR_REGISTRY/$SERVICE_NAME:$IMAGE_TAG
      - docker push $ECR_REGISTRY/$SERVICE_NAME:latest
      - echo "Updating deployment manifest..."
      - sed -i "s|IMAGE_TAG|$IMAGE_TAG|g" k8s/deployment.yaml
      - aws eks update-kubeconfig --name hr-saas-cluster --region $AWS_DEFAULT_REGION
      - kubectl apply -f k8s/

reports:
  junit-reports:
    files:
      - '**/build/test-results/test/*.xml'
    file-format: JUNITXML
  coverage-reports:
    files:
      - '**/build/reports/jacoco/test/jacocoTestReport.xml'
    file-format: JACOCOXML

cache:
  paths:
    - '/root/.gradle/caches/**/*'
    - '/root/.gradle/wrapper/**/*'

artifacts:
  files:
    - k8s/**/*
    - build/libs/*.jar
```

### 7.3 배포 전략

```yaml
# Rolling Update (기본)
apiVersion: apps/v1
kind: Deployment
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%

---
# Blue-Green Deployment (선택)
# Argo Rollouts 사용
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: ${SERVICE_NAME}
spec:
  strategy:
    blueGreen:
      activeService: ${SERVICE_NAME}
      previewService: ${SERVICE_NAME}-preview
      autoPromotionEnabled: false
      scaleDownDelaySeconds: 30
```

---

## 8. 모니터링 및 로깅

### 8.1 Prometheus 설정

```yaml
# prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s

    scrape_configs:
      # Kubernetes API Server
      - job_name: 'kubernetes-apiservers'
        kubernetes_sd_configs:
          - role: endpoints
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
          - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
            action: keep
            regex: default;kubernetes;https

      # Spring Boot Actuator
      - job_name: 'spring-boot-apps'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - hr-saas-system
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
            target_label: __address__

      # Node Exporter
      - job_name: 'node-exporter'
        kubernetes_sd_configs:
          - role: node
        relabel_configs:
          - action: labelmap
            regex: __meta_kubernetes_node_label_(.+)
```

### 8.2 Grafana 대시보드

```json
{
  "dashboard": {
    "title": "HR SaaS - Service Overview",
    "panels": [
      {
        "title": "Request Rate (per service)",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_server_requests_seconds_count[5m])) by (application)",
            "legendFormat": "{{application}}"
          }
        ]
      },
      {
        "title": "Response Time (P95)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_server_requests_seconds_bucket[5m])) by (le, application))",
            "legendFormat": "{{application}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_server_requests_seconds_count{status=~\"5..\"}[5m])) by (application) / sum(rate(http_server_requests_seconds_count[5m])) by (application) * 100",
            "legendFormat": "{{application}}"
          }
        ]
      },
      {
        "title": "JVM Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "jvm_memory_used_bytes{area=\"heap\"} / jvm_memory_max_bytes{area=\"heap\"} * 100",
            "legendFormat": "{{application}}"
          }
        ]
      }
    ]
  }
}
```

### 8.3 FluentBit 설정

```yaml
# fluent-bit-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: monitoring
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush         5
        Log_Level     info
        Daemon        off
        Parsers_File  parsers.conf

    [INPUT]
        Name              tail
        Tag               kube.*
        Path              /var/log/containers/*.log
        Parser            docker
        DB                /var/log/flb_kube.db
        Mem_Buf_Limit     50MB
        Skip_Long_Lines   On
        Refresh_Interval  10

    [FILTER]
        Name                kubernetes
        Match               kube.*
        Kube_URL            https://kubernetes.default.svc:443
        Kube_CA_File        /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        Kube_Token_File     /var/run/secrets/kubernetes.io/serviceaccount/token
        Kube_Tag_Prefix     kube.var.log.containers.
        Merge_Log           On
        K8S-Logging.Parser  On
        K8S-Logging.Exclude Off

    [OUTPUT]
        Name                cloudwatch_logs
        Match               kube.*
        region              ap-northeast-2
        log_group_name      /aws/eks/hr-saas-cluster/containers
        log_stream_prefix   fluentbit-
        auto_create_group   true

  parsers.conf: |
    [PARSER]
        Name        docker
        Format      json
        Time_Key    time
        Time_Format %Y-%m-%dT%H:%M:%S.%L
        Time_Keep   On
```

### 8.4 OpenTelemetry 설정

```yaml
# otel-collector-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: otel-collector-config
data:
  config.yaml: |
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318

    processors:
      batch:
        timeout: 10s
      memory_limiter:
        check_interval: 1s
        limit_mib: 1000
        spike_limit_mib: 200

    exporters:
      # Jaeger (Dev)
      jaeger:
        endpoint: jaeger-collector:14250
        tls:
          insecure: true
      
      # AWS X-Ray (Prod)
      awsxray:
        region: ap-northeast-2

    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [memory_limiter, batch]
          exporters: [jaeger]  # Dev
          # exporters: [awsxray]  # Prod
```

---

## 9. 보안

### 9.1 암호화

```hcl
# KMS 키 생성
resource "aws_kms_key" "main" {
  description             = "HR SaaS Main Encryption Key"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow RDS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey*"
        ]
        Resource = "*"
      }
    ]
  })
  
  tags = {
    Name = "hr-saas-kms-key"
  }
}
```

### 9.2 Secrets Manager

```hcl
# 데이터베이스 자격증명
resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "hr-saas/db/credentials"
  description = "HR SaaS Database Credentials"
  kms_key_id  = aws_kms_key.main.arn
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    host     = aws_db_instance.main.address
    port     = 5432
    dbname   = "hr_saas"
  })
}

# External Secrets Operator 설정
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: hr-saas-system
spec:
  provider:
    aws:
      service: SecretsManager
      region: ap-northeast-2
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa

---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
  namespace: hr-saas-system
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: db-credentials
    creationPolicy: Owner
  data:
    - secretKey: username
      remoteRef:
        key: hr-saas/db/credentials
        property: username
    - secretKey: password
      remoteRef:
        key: hr-saas/db/credentials
        property: password
```

### 9.3 네트워크 정책

```yaml
# network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: hr-saas-network-policy
  namespace: hr-saas-system
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    # Gateway에서만 트래픽 허용
    - from:
        - podSelector:
            matchLabels:
              app: gateway-service
      ports:
        - protocol: TCP
          port: 8080
    # 같은 네임스페이스 내부 통신
    - from:
        - namespaceSelector:
            matchLabels:
              name: hr-saas-system
  egress:
    # DNS
    - to:
        - namespaceSelector: {}
      ports:
        - protocol: UDP
          port: 53
    # 같은 네임스페이스
    - to:
        - namespaceSelector:
            matchLabels:
              name: hr-saas-system
    # AWS 서비스 (RDS, ElastiCache, MSK, S3)
    - to:
        - ipBlock:
            cidr: 10.0.0.0/16
```

### 9.4 WAF/DDoS 방어 준비

```hcl
# WAF 준비 (향후 활성화)
# resource "aws_wafv2_web_acl" "main" {
#   name        = "hr-saas-waf"
#   description = "HR SaaS WAF Rules"
#   scope       = "REGIONAL"
#
#   default_action {
#     allow {}
#   }
#
#   rule {
#     name     = "RateLimiting"
#     priority = 1
#     action {
#       block {}
#     }
#     statement {
#       rate_based_statement {
#         limit              = 2000
#         aggregate_key_type = "IP"
#       }
#     }
#     visibility_config {
#       cloudwatch_metrics_enabled = true
#       metric_name                = "RateLimitingRule"
#       sampled_requests_enabled   = true
#     }
#   }
#
#   visibility_config {
#     cloudwatch_metrics_enabled = true
#     metric_name                = "HRSaaSWAF"
#     sampled_requests_enabled   = true
#   }
# }

# Shield Standard (자동 활성화됨)
```

---

## 10. 로컬 개발 환경

### 10.1 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL
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
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hr_saas"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    container_name: hr-saas-redis
    command: redis-server --requirepass redis_password
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Kafka (KRaft mode)
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
    ports:
      - "9092:9092"
    volumes:
      - kafka_data:/bitnami/kafka
    healthcheck:
      test: ["CMD-SHELL", "kafka-topics.sh --bootstrap-server localhost:9092 --list"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Kafka UI
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

  # Keycloak
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
      - ./docker/keycloak/realm-export.json:/opt/keycloak/data/import/realm-export.json
    depends_on:
      postgres:
        condition: service_healthy

  # Spring Cloud Config Server
  config-server:
    build:
      context: ./config-server
      dockerfile: Dockerfile
    container_name: hr-saas-config-server
    environment:
      - SPRING_PROFILES_ACTIVE=native
      - SPRING_CLOUD_CONFIG_SERVER_NATIVE_SEARCH_LOCATIONS=file:/config
    ports:
      - "8888:8888"
    volumes:
      - ./config:/config
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8888/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Jaeger
  jaeger:
    image: jaegertracing/all-in-one:1.52
    container_name: hr-saas-jaeger
    environment:
      - COLLECTOR_OTLP_ENABLED=true
    ports:
      - "16686:16686"  # UI
      - "4317:4317"    # OTLP gRPC
      - "4318:4318"    # OTLP HTTP

  # Prometheus
  prometheus:
    image: prom/prometheus:v2.48.0
    container_name: hr-saas-prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    ports:
      - "9090:9090"
    volumes:
      - ./docker/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  # Grafana
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
      - ./docker/grafana/provisioning:/etc/grafana/provisioning
    depends_on:
      - prometheus

volumes:
  postgres_data:
  redis_data:
  kafka_data:
  prometheus_data:
  grafana_data:

networks:
  default:
    name: hr-saas-network
```

### 10.2 로컬 환경 시작 스크립트

```bash
#!/bin/bash
# start-local.sh

echo "🚀 Starting HR SaaS Local Environment..."

# Docker Compose 시작
docker-compose up -d

echo "⏳ Waiting for services to be ready..."

# PostgreSQL 대기
until docker exec hr-saas-postgres pg_isready -U hr_saas; do
  sleep 2
done
echo "✅ PostgreSQL is ready"

# Redis 대기
until docker exec hr-saas-redis redis-cli -a redis_password ping | grep PONG; do
  sleep 2
done
echo "✅ Redis is ready"

# Kafka 대기
sleep 10
echo "✅ Kafka is ready"

# Keycloak 대기
until curl -s http://localhost:8180/realms/master > /dev/null; do
  sleep 5
done
echo "✅ Keycloak is ready"

echo ""
echo "🎉 All services are ready!"
echo ""
echo "📍 Service URLs:"
echo "  - PostgreSQL:  localhost:5432"
echo "  - Redis:       localhost:6379"
echo "  - Kafka:       localhost:9092"
echo "  - Kafka UI:    http://localhost:8090"
echo "  - Keycloak:    http://localhost:8180 (admin/admin)"
echo "  - Jaeger:      http://localhost:16686"
echo "  - Prometheus:  http://localhost:9090"
echo "  - Grafana:     http://localhost:3000 (admin/admin)"
```

---

## 11. 비용 최적화

### 11.1 환경별 리소스 비교

| 리소스 | Dev | Production | 월 예상 비용 (Dev) | 월 예상 비용 (Prod) |
|--------|-----|------------|-------------------|---------------------|
| EKS Cluster | 1 | 1 | $73 | $73 |
| EKS Nodes | t3.medium x 2 | m5.large x 3 + Spot x 2 | $120 | $450 |
| RDS | db.t3.medium | db.r6g.xlarge (Multi-AZ) | $50 | $600 |
| ElastiCache | cache.t3.micro | cache.r6g.large x 2 | $15 | $300 |
| MSK | kafka.t3.small x 2 | kafka.m5.large x 3 | $100 | $600 |
| ALB | 1 | 1 | $20 | $50 |
| S3 | 10GB | 100GB | $1 | $10 |
| CloudWatch | Basic | Enhanced | $10 | $50 |
| NAT Gateway | Single | HA (2) | $35 | $70 |
| **Total** | | | **~$424** | **~$2,203** |

### 11.2 비용 절감 전략

```hcl
# 1. Reserved Instance (1년)
# - RDS: 42% 절감
# - ElastiCache: 35% 절감

# 2. Spot Instance (비중요 워크로드)
resource "aws_eks_node_group" "spot" {
  capacity_type = "SPOT"
  instance_types = ["m5.large", "m5a.large", "m4.large"]
  
  scaling_config {
    desired_size = 2
    max_size     = 5
    min_size     = 0
  }
}

# 3. 개발 환경 자동 중지
# Lambda 함수로 야간/주말 자동 중지
resource "aws_lambda_function" "stop_dev_resources" {
  function_name = "stop-dev-resources"
  runtime       = "python3.11"
  handler       = "index.handler"
  
  # EventBridge로 스케줄 설정
  # - 중지: 평일 20:00, 주말 전체
  # - 시작: 평일 08:00
}

# 4. S3 Intelligent-Tiering
resource "aws_s3_bucket_intelligent_tiering_configuration" "main" {
  bucket = aws_s3_bucket.main.id
  name   = "entire-bucket"

  tiering {
    access_tier = "DEEP_ARCHIVE_ACCESS"
    days        = 180
  }
  tiering {
    access_tier = "ARCHIVE_ACCESS"
    days        = 90
  }
}

# 5. CloudWatch 로그 보관 정책
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/aws/eks/hr-saas/application"
  retention_in_days = 30  # Dev: 7일, Prod: 30일
}
```

### 11.3 비용 모니터링

```yaml
# AWS Budgets 설정
budgets:
  - name: hr-saas-monthly-budget
    budget_type: COST
    limit_amount: 3000
    limit_unit: USD
    time_unit: MONTHLY
    notifications:
      - comparison_operator: GREATER_THAN
        threshold: 80
        threshold_type: PERCENTAGE
        notification_type: ACTUAL
        subscribers:
          - email: admin@company.com
      - comparison_operator: GREATER_THAN
        threshold: 100
        threshold_type: PERCENTAGE
        notification_type: FORECASTED
        subscribers:
          - email: admin@company.com
```

---

## 변경 이력

| 버전 | 일자 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2025-02-03 | - | 최초 작성 |

---

**문서 끝**