-- =============================================================================
-- V5: Performance optimization indexes for employee service
-- Addresses: name LIKE search, transfer request OR conditions
-- =============================================================================

SET search_path TO hr_core, public;

-- pg_trgm 확장 설치 (LIKE '%name%' 검색 최적화)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- employee: 이름 검색 GIN 인덱스 (pg_trgm)
-- e.name LIKE %:name% 쿼리가 이 인덱스를 자동 활용
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_name_trgm
    ON hr_core.employee USING GIN (name gin_trgm_ops);

-- transfer_request: source/target 테넌트별 상태 조회 최적화
-- OR 조건의 각 branch가 인덱스를 활용할 수 있도록 개별 인덱스 추가
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfer_request_source_tenant_status
    ON hr_core.transfer_request (source_tenant_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfer_request_target_tenant_status
    ON hr_core.transfer_request (target_tenant_id, status);
