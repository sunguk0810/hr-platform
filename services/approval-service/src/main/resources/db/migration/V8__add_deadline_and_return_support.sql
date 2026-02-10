-- =============================================================================
-- V8: Add deadline support and return (반송) functionality
-- Addresses: APR-G03 (RETURN action), APR-G10 (Deadline + auto-escalation)
-- =============================================================================

SET search_path TO hr_approval, public;

-- deadline_at: 결재 마감일
ALTER TABLE hr_approval.approval_document
    ADD COLUMN IF NOT EXISTS deadline_at TIMESTAMPTZ;

-- escalated: 자동 에스컬레이션 여부
ALTER TABLE hr_approval.approval_document
    ADD COLUMN IF NOT EXISTS escalated BOOLEAN DEFAULT false;

-- return_count: 반송 횟수
ALTER TABLE hr_approval.approval_document
    ADD COLUMN IF NOT EXISTS return_count INTEGER DEFAULT 0;

-- Index: 마감일이 있고 진행 중인 문서 조회 (스케줄러용)
CREATE INDEX IF NOT EXISTS idx_approval_document_deadline
    ON hr_approval.approval_document (deadline_at)
    WHERE status = 'IN_PROGRESS' AND deadline_at IS NOT NULL;
