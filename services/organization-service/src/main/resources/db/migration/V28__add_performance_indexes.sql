-- =============================================================================
-- V28: Performance optimization indexes for organization service
-- Addresses: announcement sorting, department hierarchy, full-text search
-- =============================================================================

SET search_path TO hr_core, public;

-- announcement: 공개된 공지 정렬 최적화 (pinned + published_at)
CREATE INDEX IF NOT EXISTS idx_announcement_tenant_pinned_published
    ON hr_core.announcement (tenant_id, is_pinned DESC, published_at DESC NULLS LAST)
    WHERE is_published = true;

-- department: 계층 구조 조회 최적화 (status + parent_id + sort_order)
CREATE INDEX IF NOT EXISTS idx_department_tenant_status_parent_sort
    ON hr_core.department (tenant_id, status, parent_id, sort_order);

-- =============================================================================
-- Announcement 전문 검색 (PostgreSQL FTS)
-- LOWER(title) LIKE → tsvector + GIN 인덱스로 변경
-- =============================================================================

-- tsvector 컬럼 추가
ALTER TABLE hr_core.announcement
    ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- GIN 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_announcement_search_vector
    ON hr_core.announcement USING GIN (search_vector);

-- tsvector 업데이트 함수
CREATE OR REPLACE FUNCTION hr_core.announcement_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.content, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trg_announcement_search_vector ON hr_core.announcement;
CREATE TRIGGER trg_announcement_search_vector
    BEFORE INSERT OR UPDATE OF title, content ON hr_core.announcement
    FOR EACH ROW
    EXECUTE FUNCTION hr_core.announcement_search_vector_update();

-- 기존 데이터 업데이트
UPDATE hr_core.announcement SET search_vector =
    setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(content, '')), 'B')
WHERE search_vector IS NULL;
