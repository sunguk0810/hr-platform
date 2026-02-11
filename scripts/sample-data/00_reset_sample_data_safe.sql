-- ============================================================================
-- 00_reset_sample_data_safe.sql
-- 안전한 샘플 데이터 초기화 (데드락 방지)
-- ============================================================================
-- 개선 사항:
-- 1. CASCADE 대신 의존성 역순으로 개별 TRUNCATE
-- 2. TRUNCATE 대신 DELETE 사용 (더 느리지만 안전)
-- 3. 락 타임아웃 설정
-- 4. FK 비활성화 옵션
-- ============================================================================

-- 락 대기 타임아웃 설정 (30초)
SET lock_timeout = '30s';
SET statement_timeout = '5min';

-- RLS 비활성화 (슈퍼유저 권한으로 데이터 삭제)
SET app.current_tenant = '00000000-0000-0000-0000-000000000000';

-- ============================================================================
-- Method 1: DELETE FROM (안전하지만 느림)
-- ============================================================================
DO $$
DECLARE
    v_count INT;
BEGIN
    -- 트랜잭션은 DO 블록이 자동으로 처리
    RAISE NOTICE '샘플 데이터 삭제 시작...';
    -- 의존성 역순으로 DELETE (CASCADE 없이)

    -- 1. Notification & File (최상위 의존)
    DELETE FROM hr_notification.notification;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  Deleted % rows from notification', v_count;

    DELETE FROM hr_file.file_metadata;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  Deleted % rows from file_metadata', v_count;

    -- 2. Certificate & Appointment
    DELETE FROM hr_certificate.verification_log;
    DELETE FROM hr_certificate.certificate_issue;
    DELETE FROM hr_certificate.certificate_request;
    DELETE FROM hr_certificate.certificate_type;
    DELETE FROM hr_certificate.certificate_template;
    RAISE NOTICE '  Deleted certificate data';

    DELETE FROM hr_appointment.appointment_history;
    DELETE FROM hr_appointment.appointment_schedule;
    DELETE FROM hr_appointment.appointment_detail;
    DELETE FROM hr_appointment.appointment_draft;
    RAISE NOTICE '  Deleted appointment data';

    -- 3. Recruitment (blacklist 테이블 없음)
    DELETE FROM hr_recruitment.offer;
    DELETE FROM hr_recruitment.interview_score;
    DELETE FROM hr_recruitment.interview;
    DELETE FROM hr_recruitment.application;
    DELETE FROM hr_recruitment.applicant;
    DELETE FROM hr_recruitment.job_posting;
    RAISE NOTICE '  Deleted recruitment data';

    -- 4. Approval
    DELETE FROM hr_approval.delegation_rule;
    DELETE FROM hr_approval.arbitrary_approval_rule;
    DELETE FROM hr_approval.conditional_route;
    DELETE FROM hr_approval.approval_history;
    DELETE FROM hr_approval.approval_line;
    DELETE FROM hr_approval.approval_document;
    DELETE FROM hr_approval.approval_template_line;
    DELETE FROM hr_approval.approval_template;
    RAISE NOTICE '  Deleted approval data';

    -- 5. Attendance
    DELETE FROM hr_attendance.overtime_request;
    DELETE FROM hr_attendance.leave_request;
    DELETE FROM hr_attendance.attendance_modification_log;
    DELETE FROM hr_attendance.attendance_record;
    DELETE FROM hr_attendance.leave_balance;
    DELETE FROM hr_attendance.leave_accrual_rule;
    DELETE FROM hr_attendance.leave_type_config;
    DELETE FROM hr_attendance.holiday;
    RAISE NOTICE '  Deleted attendance data';

    -- 6. Organization extras
    DELETE FROM hr_core.employee_card;
    DELETE FROM hr_core.card_issue_request;
    DELETE FROM hr_core.transfer_request;
    DELETE FROM hr_core.organization_history;
    DELETE FROM hr_core.condolence_request;
    DELETE FROM hr_core.condolence_policy;
    DELETE FROM hr_core.headcount_history;
    DELETE FROM hr_core.headcount_request;
    DELETE FROM hr_core.headcount_plan;
    DELETE FROM hr_core.committee_member;
    DELETE FROM hr_core.committee;
    DELETE FROM hr_core.announcement_read;
    DELETE FROM hr_core.announcement_target;
    DELETE FROM hr_core.announcement_attachment;
    DELETE FROM hr_core.announcement;
    RAISE NOTICE '  Deleted organization extras';

    -- 7. Auth
    DELETE FROM tenant_common.audit_log;
    DELETE FROM tenant_common.password_history;
    DELETE FROM tenant_common.login_history;
    DELETE FROM tenant_common.user_sessions;
    DELETE FROM tenant_common.password_reset_tokens;
    DELETE FROM tenant_common.mfa_recovery_codes;
    DELETE FROM tenant_common.user_mfa;
    DELETE FROM tenant_common.users;
    RAISE NOTICE '  Deleted auth data';

    -- 8. Employee (FK 많음)
    DELETE FROM hr_core.privacy_access_log;
    DELETE FROM hr_core.employee_change_request;
    DELETE FROM hr_core.employee_history;
    DELETE FROM hr_core.employee_affiliation;
    DELETE FROM hr_core.employee_certificate;
    DELETE FROM hr_core.employee_career;
    DELETE FROM hr_core.employee_education;
    DELETE FROM hr_core.employee_family;
    DELETE FROM hr_core.employee_number_rule;
    DELETE FROM hr_core.employee;
    RAISE NOTICE '  Deleted employee data';

    -- 9. Organization
    DELETE FROM hr_core.department;
    DELETE FROM hr_core.position;
    DELETE FROM hr_core.grade;
    RAISE NOTICE '  Deleted organization data';

    -- 10. MDM
    DELETE FROM tenant_common.tenant_menu_config;
    DELETE FROM tenant_common.menu_permission;
    DELETE FROM tenant_common.menu_item;
    DELETE FROM tenant_common.code_usage_mapping;
    DELETE FROM tenant_common.code_tenant_mapping;
    DELETE FROM tenant_common.code_history;
    DELETE FROM tenant_common.common_code;
    DELETE FROM tenant_common.code_group;
    RAISE NOTICE '  Deleted MDM data';

    -- 11. Tenant (최하위)
    DELETE FROM tenant_common.policy_change_history;
    DELETE FROM tenant_common.tenant_feature;
    DELETE FROM tenant_common.tenant_policy;
    DELETE FROM tenant_common.tenant WHERE id <> '00000000-0000-0000-0000-000000000000';
    RAISE NOTICE '  Deleted tenant data';

    RAISE NOTICE '';
    RAISE NOTICE '샘플 데이터 삭제 완료!';
END $$;

-- 시퀀스 리셋 (필요시)
-- ALTER SEQUENCE ... RESTART WITH 1;

RESET lock_timeout;
RESET statement_timeout;
RESET app.current_tenant;
