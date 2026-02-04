# HR SaaS Platform - AWS Deployment Scripts

Windows 및 Linux/Mac 환경 모두에서 사용할 수 있는 배포 스크립트 모음입니다.

## 사전 요구사항

- AWS CLI 설치 및 구성 (`aws configure`)
- Terraform 설치 (v1.5.0+)
- Docker Desktop 설치
- Java 17+ 및 Gradle

## 스크립트 목록

| 스크립트 | Windows (Batch) | Windows (PowerShell) | Linux/Mac |
|---------|-----------------|---------------------|-----------|
| AWS 초기 설정 | `setup-aws.bat` | - | - |
| 이미지 빌드 | `build-images.bat` | `build-images.ps1` | - |
| DB 마이그레이션 | `migrate-db.bat` | `migrate-db.ps1` | `migrate-db.sh` |
| 서비스 배포 | `deploy.bat` | `deploy.ps1` | `deploy.sh` |

## 사용 방법

### 1. AWS 초기 설정

```batch
REM Windows
infra\aws\scripts\setup-aws.bat dev
```

### 2. Docker 이미지 빌드 및 푸시

```batch
REM Windows Batch - 전체 서비스
infra\aws\scripts\build-images.bat all latest

REM Windows Batch - 특정 서비스
infra\aws\scripts\build-images.bat employee-service v1.0.0

REM Windows PowerShell
.\infra\aws\scripts\build-images.ps1 -Service all -Tag latest
```

### 3. 데이터베이스 마이그레이션

```batch
REM Windows Batch
infra\aws\scripts\migrate-db.bat dev

REM Windows PowerShell
.\infra\aws\scripts\migrate-db.ps1 -Environment dev

REM 마이그레이션 상태만 확인
.\infra\aws\scripts\migrate-db.ps1 -Environment dev -Info
```

### 4. 서비스 배포

```batch
REM Windows Batch - 전체 서비스
infra\aws\scripts\deploy.bat dev all latest

REM Windows Batch - 특정 서비스
infra\aws\scripts\deploy.bat dev employee-service v1.0.0

REM Windows PowerShell
.\infra\aws\scripts\deploy.ps1 -Environment dev -Service all -ImageTag latest
```

## Terraform 직접 실행

```batch
REM Windows
cd infra\aws\terraform\environments\dev
terraform init
terraform plan
terraform apply
```

## 환경별 설정

| 환경 | 설명 | RDS 인스턴스 | Redis 인스턴스 |
|------|------|-------------|---------------|
| dev | 개발 환경 | db.t3.micro | cache.t3.micro |
| staging | 스테이징 환경 | db.t3.small | cache.t3.small |
| prod | 운영 환경 | db.t3.medium | cache.t3.small |

## 문제 해결

### AWS CLI 인증 실패
```batch
aws configure
```

### ECR 로그인 실패
```batch
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin <ECR_URI>
```

### Terraform 상태 잠금
```batch
terraform force-unlock <LOCK_ID>
```

## 비용 참고

- **Dev 환경**: ~$165/월
- **Staging 환경**: ~$200/월
- **Prod 환경**: ~$350/월 (Multi-AZ 포함)
