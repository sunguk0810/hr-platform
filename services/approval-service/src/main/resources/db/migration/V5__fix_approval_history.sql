-- ============================================================================
-- V5__fix_approval_history.sql
-- approval_history 테이블에 step_order 컬럼 추가
-- ============================================================================

ALTER TABLE hr_approval.approval_history ADD COLUMN IF NOT EXISTS step_order INT DEFAULT 0;
