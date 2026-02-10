-- =============================================================================
-- V7: Performance optimization indexes for approval service
-- Addresses: approval_line approver lookup optimization
-- =============================================================================

SET search_path TO hr_approval, public;

-- approval_line: 승인자별 활성 결재선 조회 최적화
CREATE INDEX IF NOT EXISTS idx_approval_line_approver_status
    ON hr_approval.approval_line (approver_id, status)
    WHERE status = 'ACTIVE';
