-- ============================================================================
-- 00_reset_sample_data.sql
-- 샘플 데이터 초기화 (기존 샘플 데이터 삭제)
-- ============================================================================
-- 주의: 이 스크립트는 모든 샘플 데이터를 삭제합니다.
-- 운영 환경에서는 절대 실행하지 마세요!
-- ============================================================================

-- RLS 비활성화 (데이터 삭제를 위해)
SET app.current_tenant = '00000000-0000-0000-0000-000000000000';

-- 트랜잭션 시작
BEGIN;

-- ============================================================================
-- 역순으로 데이터 삭제 (외래키 의존성 순서)
-- ============================================================================

-- 0-0. Auth 서비스 관련
TRUNCATE TABLE tenant_common.login_history CASCADE;
TRUNCATE TABLE tenant_common.account_locks CASCADE;
TRUNCATE TABLE tenant_common.password_reset_tokens CASCADE;
TRUNCATE TABLE tenant_common.user_sessions CASCADE;

-- 0-1. 증명서 관련
TRUNCATE TABLE hr_certificate.verification_log CASCADE;
TRUNCATE TABLE hr_certificate.certificate_issue CASCADE;
TRUNCATE TABLE hr_certificate.certificate_request CASCADE;
TRUNCATE TABLE hr_certificate.certificate_type CASCADE;
TRUNCATE TABLE hr_certificate.certificate_template CASCADE;

-- 0-2. 발령 관련
TRUNCATE TABLE hr_appointment.appointment_history CASCADE;
TRUNCATE TABLE hr_appointment.appointment_schedule CASCADE;
TRUNCATE TABLE hr_appointment.appointment_detail CASCADE;
TRUNCATE TABLE hr_appointment.appointment_draft CASCADE;

-- 1. 채용 관련
TRUNCATE TABLE hr_recruitment.offer CASCADE;
TRUNCATE TABLE hr_recruitment.interview_score CASCADE;
TRUNCATE TABLE hr_recruitment.interview CASCADE;
TRUNCATE TABLE hr_recruitment.application CASCADE;
TRUNCATE TABLE hr_recruitment.applicant CASCADE;
TRUNCATE TABLE hr_recruitment.job_posting CASCADE;

-- 2. 결재 관련
TRUNCATE TABLE hr_approval.approval_history CASCADE;
TRUNCATE TABLE hr_approval.approval_line CASCADE;
TRUNCATE TABLE hr_approval.approval_document CASCADE;
TRUNCATE TABLE hr_approval.delegation_rule CASCADE;
TRUNCATE TABLE hr_approval.approval_template_line CASCADE;
TRUNCATE TABLE hr_approval.approval_template CASCADE;

-- 2. 근태 관련
TRUNCATE TABLE hr_attendance.overtime_request CASCADE;
TRUNCATE TABLE hr_attendance.leave_request CASCADE;
TRUNCATE TABLE hr_attendance.attendance_record CASCADE;
TRUNCATE TABLE hr_attendance.leave_balance CASCADE;
TRUNCATE TABLE hr_attendance.holiday CASCADE;

-- 3. 알림 관련
TRUNCATE TABLE hr_notification.notification CASCADE;
TRUNCATE TABLE hr_notification.notification_preference CASCADE;
TRUNCATE TABLE hr_notification.notification_template CASCADE;

-- 4. 파일 관련
TRUNCATE TABLE hr_file.file_metadata CASCADE;

-- 5. 직원 관련
TRUNCATE TABLE hr_core.employee_certificate CASCADE;
TRUNCATE TABLE hr_core.employee_career CASCADE;
TRUNCATE TABLE hr_core.employee_education CASCADE;
TRUNCATE TABLE hr_core.employee_family CASCADE;
TRUNCATE TABLE hr_core.employee_history CASCADE;
TRUNCATE TABLE hr_core.employee CASCADE;

-- 6. 조직 관련
TRUNCATE TABLE hr_core.department CASCADE;
TRUNCATE TABLE hr_core.grade CASCADE;
TRUNCATE TABLE hr_core.position CASCADE;

-- 7. MDM 관련
TRUNCATE TABLE tenant_common.code_history CASCADE;
TRUNCATE TABLE tenant_common.code_tenant_mapping CASCADE;
TRUNCATE TABLE tenant_common.common_code CASCADE;
TRUNCATE TABLE tenant_common.code_group CASCADE;
TRUNCATE TABLE tenant_common.tenant_menu_config CASCADE;
TRUNCATE TABLE tenant_common.menu_permission CASCADE;
TRUNCATE TABLE tenant_common.menu_item CASCADE;

-- 8. 테넌트 관련
TRUNCATE TABLE tenant_common.tenant_feature CASCADE;
TRUNCATE TABLE tenant_common.tenant_policy CASCADE;
TRUNCATE TABLE tenant_common.tenant CASCADE;

COMMIT;

-- 시퀀스 리셋 (필요시)
-- SELECT setval('some_sequence', 1, false);

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '샘플 데이터 초기화 완료!';
END $$;
