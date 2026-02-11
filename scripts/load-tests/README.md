# Load Testing Suite

Performance testing scripts for HR Platform using [k6](https://k6.io/).

## Prerequisites

Install k6:
```bash
# Windows (Chocolatey)
choco install k6

# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## Quick Start

### 1. Get Authentication Token

```bash
# Login to get JWT token
curl -X POST "http://localhost:18080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d @../../test-logins/login-ceo.json \
  | jq -r '.data.accessToken' > .token

export JWT_TOKEN=$(cat .token)
export TENANT_ID="a0000001-0000-0000-0000-000000000002"
```

### 2. Run Load Tests

```bash
# Appointment Summary - Baseline (before optimization)
k6 run --env JWT_TOKEN=$JWT_TOKEN --env TENANT_ID=$TENANT_ID \
  appointment-summary-baseline.js

# Appointment Summary - Optimized (after optimization)
k6 run --env JWT_TOKEN=$JWT_TOKEN --env TENANT_ID=$TENANT_ID \
  appointment-summary-optimized.js

# Transfer API
k6 run --env JWT_TOKEN=$JWT_TOKEN --env TENANT_ID=$TENANT_ID \
  transfer-api-load-test.js

# Recruitment API
k6 run --env JWT_TOKEN=$JWT_TOKEN --env TENANT_ID=$TENANT_ID \
  recruitment-api-load-test.js

# Full suite
k6 run --env JWT_TOKEN=$JWT_TOKEN --env TENANT_ID=$TENANT_ID \
  full-suite.js
```

### 3. View Results

Results are automatically exported to:
- `results/` - JSON summary files
- Grafana dashboard at http://localhost:13000

## Test Profiles

### Smoke Test (Quick validation)
```bash
k6 run --vus 1 --duration 30s <test-file.js>
```

### Load Test (Normal traffic)
```bash
k6 run --vus 50 --duration 5m <test-file.js>
```

### Stress Test (Breaking point)
```bash
k6 run --vus 100 --duration 10m <test-file.js>
```

### Spike Test (Traffic spike)
```bash
k6 run --stage 30s:10,1m:100,30s:10 <test-file.js>
```

## Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| Response Time (P95) | < 100ms | < 500ms |
| Response Time (P99) | < 200ms | < 1000ms |
| Error Rate | < 0.1% | < 1% |
| Throughput | > 1000 req/s | > 500 req/s |

## Interpreting Results

### Good Performance
```
✓ http_req_duration..............: avg=45ms  min=10ms med=40ms max=150ms p(90)=80ms p(95)=95ms
✓ http_req_failed................: 0.00%
✓ http_reqs......................: 15000 (1000/s)
```

### Performance Issues
```
✗ http_req_duration..............: avg=450ms  min=50ms med=400ms max=2500ms p(90)=800ms p(95)=1200ms
✗ http_req_failed................: 2.5%
✗ http_reqs......................: 5000 (333/s)
```

## Grafana Dashboard

Real-time metrics are available at:
- URL: http://localhost:13000
- Dashboard: "HR Platform Performance"
- Refresh: Auto (5s)

## Troubleshooting

### Connection Refused
```bash
# Check if services are running
docker-compose ps

# Check gateway
curl http://localhost:18080/actuator/health
```

### Authentication Failures
```bash
# Regenerate token
curl -X POST "http://localhost:18080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d @../../test-logins/login-ceo.json
```

### High Error Rates
- Check application logs: `docker-compose logs -f <service-name>`
- Check database connections: `docker-compose exec postgres psql -U hr_saas -c "SELECT count(*) FROM pg_stat_activity;"`
- Check Redis: `docker-compose exec redis redis-cli ping`
