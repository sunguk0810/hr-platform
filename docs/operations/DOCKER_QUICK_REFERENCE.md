# Docker Quick Reference - HR SaaS Platform

## Daily Development Commands

### Start All Services (Development Mode)
```bash
# Basic start (infrastructure + all app services)
docker-compose --profile app up -d

# With hot reload (no rebuild needed, < 5s restart on code changes)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml --profile app up -d

# With resource limits (prevents OOM cascade)
docker-compose -f docker-compose.yml -f docker-compose.resources.yml --profile app up -d

# Full development mode (hot reload + resource limits)
docker-compose -f docker-compose.yml -f docker-compose.resources.yml -f docker-compose.dev.yml --profile app up -d
```

### Start Specific Services
```bash
# Infrastructure only (Postgres, Redis, LocalStack)
docker-compose up -d postgres redis localstack

# Single service in dev mode with hot reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d auth-service

# Multiple services
docker-compose --profile app up -d auth-service employee-service attendance-service
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f auth-service

# Last 100 lines
docker-compose logs --tail=100 employee-service
```

### Health Check
```bash
# Quick health check (all services)
./scripts/health-check.ps1   # Windows
./scripts/health-check.sh    # Linux/Mac

# Manual check
docker-compose ps
curl http://localhost:8081/actuator/health  # Auth service
```

### Stop & Clean Up
```bash
# Stop all services (keeps volumes)
docker-compose down

# Stop and remove volumes (DESTRUCTIVE!)
docker-compose down -v

# Stop specific service
docker-compose stop auth-service

# Restart specific service
docker-compose restart auth-service
```

### Rebuild Services
```bash
# Rebuild single service (with BuildKit cache = fast!)
docker-compose build auth-service

# Rebuild without cache (clean build)
docker-compose build --no-cache auth-service

# Rebuild all services
docker-compose build

# Rebuild and restart
docker-compose up -d --build auth-service
```

---

## Port Reference

### Infrastructure
| Service | Port | URL |
|---------|------|-----|
| PostgreSQL | 15432 | `localhost:15432` |
| Redis | 16379 | `localhost:16379` |
| LocalStack (AWS) | 14566 | `http://localhost:14566` |
| Jaeger UI | 16686 | `http://localhost:16686` |
| Prometheus | 19090 | `http://localhost:19090` |
| Grafana | 13000 | `http://localhost:13000` |
| Traefik Dashboard | 18090 | `http://localhost:18090` |

### Application Services
| Service | HTTP Port | Debug Port | Actuator Health |
|---------|-----------|------------|-----------------|
| Auth | 8081 | 5005 | `http://localhost:8081/actuator/health` |
| Tenant | 8082 | 5006 | `http://localhost:8082/actuator/health` |
| Organization | 8083 | 5007 | `http://localhost:8083/actuator/health` |
| Employee | 8084 | 5008 | `http://localhost:8084/actuator/health` |
| Attendance | 8085 | 5009 | `http://localhost:8085/actuator/health` |
| Approval | 8086 | 5010 | `http://localhost:8086/actuator/health` |
| MDM | 8087 | 5011 | `http://localhost:8087/actuator/health` |
| Notification | 8088 | 5012 | `http://localhost:8088/actuator/health` |
| File | 8089 | 5013 | `http://localhost:8089/actuator/health` |
| Appointment | 8091 | 5014 | `http://localhost:8091/actuator/health` |
| Certificate | 8092 | 5015 | `http://localhost:8092/actuator/health` |
| Recruitment | 8093 | 5016 | `http://localhost:8093/actuator/health` |

---

## Debugging

### Attach Remote Debugger (IntelliJ IDEA)
1. Start service in dev mode
2. Run → Edit Configurations → Add New → Remote JVM Debug
3. Host: `localhost`, Port: `5005` (see table above)
4. Click OK, then Debug

### Hot Reload (Spring DevTools)
When running in dev mode:
1. Edit Java code
2. Save file
3. **Service automatically restarts in < 5 seconds**

---

## Troubleshooting

### Service Won't Start
```bash
docker-compose logs -f auth-service
docker-compose restart auth-service
```

### Database Connection Issues
```bash
docker-compose ps postgres
docker exec -it hr-saas-postgres psql -U hr_saas -d hr_saas
```

### Out of Memory Errors
```bash
docker stats
# Increase limits in docker-compose.resources.yml if needed
```

---

## Performance Tips

### Build Performance (80% faster rebuilds!)
- First build: 5-7 minutes
- Rebuild after code change: 45-90 seconds
- Hot reload: < 5 seconds

### Resource Requirements
- Infrastructure only: ~3GB RAM
- All services (with limits): ~12GB RAM
- **Recommended**: 16GB RAM, 8 CPU cores

---

## Security Notes

### Environment Variables
- **NEVER commit `.env` files**
- Copy `.env.example` to `.env`
- Change all passwords in production

### Production Checklist
- Change all default passwords
- Use AWS Secrets Manager
- Enable SSL/TLS
- Use IAM roles
- Set `SPRING_PROFILES_ACTIVE=prod`
