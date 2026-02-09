# Phase 1 - Action Items & Quick Summary

**Status**: ✅ Code Complete, ⚠️ Configuration Review Needed
**Branch**: `perf/phase-1-hikaricp-config`
**Review Document**: [PHASE_1_REVIEW.md](./PHASE_1_REVIEW.md)

---

## 🎯 What Was Done

✅ Added HikariCP connection pool configuration to **8 services**:
- High-traffic (20 connections): employee, auth, organization
- Standard (10 connections): tenant, mdm
- Batch-heavy (15 connections): appointment
- Low-traffic (5 connections): certificate, recruitment

✅ Fixed transaction propagation in **EmployeeCreatedCardListener**:
- Card issuance failures no longer rollback employee creation
- Uses `Propagation.REQUIRES_NEW` for isolation

✅ All services **build successfully** (zero compilation errors)

---

## ⚠️ Critical Action Required Before Merge

### 1. PostgreSQL max_connections Check

**Problem**: Total HikariCP pool size may exceed PostgreSQL max_connections limit.

**Current Calculation**:
```
High-traffic:    3 services × 20 connections = 60
Standard:        2 services × 10 connections = 20
Batch-heavy:     1 service  × 15 connections = 15
Low-traffic:     2 services ×  5 connections = 10
                                        Total = 105 connections
```

**PostgreSQL Default**: 100 connections (❌ **INSUFFICIENT**)

**Solution**: Increase PostgreSQL max_connections to **150-200**

#### Option A: Docker Compose (Recommended for Local Dev)

Add command to postgres service in `docker/docker-compose.yml`:

```yaml
postgres:
  image: postgres:15-alpine
  command: postgres -c max_connections=200
  # ... rest of config
```

#### Option B: Custom postgresql.conf

Create `docker/postgres/postgresql.conf`:
```conf
max_connections = 200
shared_buffers = 256MB  # Adjust based on available RAM
```

Mount in docker-compose.yml:
```yaml
postgres:
  volumes:
    - ./postgres/postgresql.conf:/etc/postgresql/postgresql.conf
  command: postgres -c config_file=/etc/postgresql/postgresql.conf
```

#### Option C: Production Environment (Terraform/AWS RDS)

Update RDS parameter group:
```hcl
resource "aws_db_parameter_group" "hr_platform" {
  parameter {
    name  = "max_connections"
    value = "200"
  }
}
```

---

### 2. Remove leak-detection-threshold in Production

**Current**: All services have `leak-detection-threshold: 60000`

**Action**: Create production profile override

Create `services/*/src/main/resources/application-prod.yml`:
```yaml
spring:
  datasource:
    hikari:
      leak-detection-threshold: 0  # Disable in production (performance overhead)
```

Or use environment variable:
```bash
SPRING_DATASOURCE_HIKARI_LEAK_DETECTION_THRESHOLD=0
```

---

## 📊 Monitoring Setup (Before Deploy)

### Grafana Dashboards

1. **HikariCP Connection Pool Dashboard**
   - Panel 1: Active connections (gauge, alert if >80% of max)
   - Panel 2: Pending connections (line chart, alert if >0 for >1min)
   - Panel 3: Connection timeout errors (counter)
   - Panel 4: Connection acquisition time (histogram, p50/p95/p99)

**PromQL Queries**:
```promql
# Active connections percentage
(hikaricp_connections_active / hikaricp_connections_max) * 100

# Pending connection requests (pool exhaustion indicator)
hikaricp_connections_pending

# Connection timeouts (critical alert)
rate(hikaricp_connections_timeout_total[5m])

# Connection acquisition time p99 (latency)
histogram_quantile(0.99, rate(hikaricp_connections_acquire_seconds_bucket[5m]))
```

### Alerts

**Critical**:
- Connection timeout rate > 1/minute → Page on-call engineer
- Active connections > 95% of max for >5 minutes → Investigate pool size

**Warning**:
- Active connections > 80% of max for >10 minutes → Consider increasing pool
- Connection acquisition time p99 > 1s → Check database performance

---

## 🧪 Testing Checklist

Before merging to master:

- [ ] **Local Environment Test**
  ```bash
  # 1. Update docker-compose.yml with max_connections=200
  cd docker && docker-compose down && docker-compose up -d

  # 2. Start each service and verify HikariCP metrics
  curl http://localhost:8084/actuator/metrics/hikaricp.connections.active
  curl http://localhost:8081/actuator/metrics/hikaricp.connections.active
  # ... repeat for all 8 services
  ```

- [ ] **Load Test (Employee Service)**
  ```bash
  # Install ApacheBench
  # Windows: https://www.apachelounge.com/download/
  # Linux: sudo apt install apache2-utils

  # Test with 50 concurrent users
  ab -n 10000 -c 50 -H "Authorization: Bearer <JWT_TOKEN>" \
     http://localhost:8084/api/v1/employees/me

  # Monitor during test:
  watch -n 1 "curl -s http://localhost:8084/actuator/metrics/hikaricp.connections.active | jq"
  ```

- [ ] **Verify No Connection Errors**
  ```bash
  # Check logs for connection timeout errors
  docker logs hr-saas-employee-service 2>&1 | grep -i "connection.*timeout"
  docker logs hr-saas-auth-service 2>&1 | grep -i "connection.*timeout"
  ```

- [ ] **Transaction Isolation Test (EmployeeCreatedCardListener)**
  ```bash
  # 1. Mock card service to throw exception
  # 2. Create employee via API
  # 3. Verify employee persists in DB despite card failure
  # 4. Check logs for "Failed to auto-issue employee card" warning
  ```

---

## 📝 Merge Checklist

- [ ] PostgreSQL max_connections increased to 200
- [ ] HikariCP metrics exposed via Actuator
- [ ] Grafana dashboard created with alerts
- [ ] Load testing completed successfully
- [ ] Zero connection timeout errors during load test
- [ ] Transaction isolation verified
- [ ] Production config created (leak-detection disabled)
- [ ] Documentation updated in MEMORY.md

---

## 🚀 Deployment Strategy

### Step 1: Development Environment (This Week)
1. Update docker-compose.yml with max_connections=200
2. Deploy all 8 services with new HikariCP config
3. Monitor for 24-48 hours
4. Collect baseline metrics (active connections, acquisition time)

### Step 2: Staging Environment (Next Week)
1. Apply database parameter group changes
2. Deploy services via CI/CD
3. Run load tests
4. Verify metrics match development environment

### Step 3: Production Canary (Week 3)
1. Deploy to 10% of production traffic
2. Monitor for 24 hours
3. Compare metrics with control group
4. Full rollout if no issues

---

## 📈 Success Metrics

After deployment, verify:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| No connection timeouts | 0 errors | Check Prometheus `hikaricp_connections_timeout_total` |
| Connection acquisition < 100ms | p99 < 100ms | Grafana dashboard |
| Pool utilization < 80% | Average < 80% | `hikaricp_connections_active / max * 100` |
| No database max_connections errors | 0 errors | PostgreSQL logs: `grep "too many clients"` |
| Employee creation resilient | 100% success | Test card service failures |

---

## ⏭️ Next Phase Preview

**Phase 2: N+1 Query Fixes** (Starting after Phase 1 approval)

Will reduce database queries by 70-99%:
- Department tree: 110 queries → 4 queries (96% reduction)
- Approval templates: 101 queries → 1 query (99% reduction)
- Approval documents: 3+ queries → 1 query (67% reduction)

---

## 🆘 Rollback Plan

If issues occur after deployment:

### Immediate Rollback (Revert Config)
```bash
# 1. Checkout previous version
git revert <commit-hash>
git push origin master

# 2. Redeploy services
# Services will use default HikariCP settings (pool size 10)
```

### Database Rollback (If max_connections causes issues)
```sql
-- Revert to default
ALTER SYSTEM SET max_connections = 100;
SELECT pg_reload_conf();
```

---

**Questions?** See full review at [PHASE_1_REVIEW.md](./PHASE_1_REVIEW.md)

**Ready to proceed?** Complete action items above, then approve merge.
