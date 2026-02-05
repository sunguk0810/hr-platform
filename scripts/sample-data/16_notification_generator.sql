-- ============================================================================
-- 16_notification_generator.sql
-- 알림 관련 데이터 생성 (템플릿, 설정, 알림)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. 알림 템플릿 생성 (각 테넌트별)
-- ============================================================================
DO $$
DECLARE
    v_tenant RECORD;
BEGIN
    RAISE NOTICE '알림 템플릿 생성 중...';

    FOR v_tenant IN SELECT id, code, name FROM tenant_common.tenant LOOP

        -- 결재 관련 알림 템플릿
        INSERT INTO hr_notification.notification_template (
            tenant_id, code, notification_type, channel, name, subject, body_template, description, is_active, variables,
            created_at, updated_at, created_by, updated_by
        ) VALUES
        -- 결재 요청
        (v_tenant.id, 'APPROVAL_REQUEST', 'APPROVAL', 'EMAIL', '결재 요청 알림',
         '[결재요청] {{document_title}}',
         '안녕하세요, {{recipient_name}}님.\n\n새로운 결재 요청이 도착했습니다.\n\n- 문서명: {{document_title}}\n- 기안자: {{drafter_name}}\n- 기안일: {{submitted_at}}\n\n결재 시스템에서 확인해 주세요.',
         '결재 요청 시 결재자에게 발송되는 이메일', true, '["recipient_name", "document_title", "drafter_name", "submitted_at"]',
         NOW(), NOW(), 'system', 'system'),

        (v_tenant.id, 'APPROVAL_REQUEST_PUSH', 'APPROVAL', 'PUSH', '결재 요청 푸시',
         NULL, '{{drafter_name}}님이 결재를 요청했습니다: {{document_title}}',
         '결재 요청 시 푸시 알림', true, '["drafter_name", "document_title"]',
         NOW(), NOW(), 'system', 'system'),

        -- 결재 승인
        (v_tenant.id, 'APPROVAL_APPROVED', 'APPROVAL', 'EMAIL', '결재 승인 알림',
         '[결재완료] {{document_title}} 승인되었습니다',
         '안녕하세요, {{recipient_name}}님.\n\n요청하신 결재가 승인되었습니다.\n\n- 문서명: {{document_title}}\n- 결재자: {{approver_name}}\n- 승인일: {{completed_at}}\n\n감사합니다.',
         '결재 승인 시 기안자에게 발송되는 이메일', true, '["recipient_name", "document_title", "approver_name", "completed_at"]',
         NOW(), NOW(), 'system', 'system'),

        (v_tenant.id, 'APPROVAL_APPROVED_PUSH', 'APPROVAL', 'PUSH', '결재 승인 푸시',
         NULL, '결재가 승인되었습니다: {{document_title}}',
         '결재 승인 시 푸시 알림', true, '["document_title"]',
         NOW(), NOW(), 'system', 'system'),

        -- 결재 반려
        (v_tenant.id, 'APPROVAL_REJECTED', 'APPROVAL', 'EMAIL', '결재 반려 알림',
         '[결재반려] {{document_title}} 반려되었습니다',
         '안녕하세요, {{recipient_name}}님.\n\n요청하신 결재가 반려되었습니다.\n\n- 문서명: {{document_title}}\n- 결재자: {{approver_name}}\n- 반려사유: {{reject_reason}}\n\n내용을 확인하시고 필요시 재상신해 주세요.',
         '결재 반려 시 기안자에게 발송되는 이메일', true, '["recipient_name", "document_title", "approver_name", "reject_reason"]',
         NOW(), NOW(), 'system', 'system'),

        -- 휴가 관련 알림
        (v_tenant.id, 'LEAVE_APPROVED', 'LEAVE', 'EMAIL', '휴가 승인 알림',
         '[휴가승인] {{leave_type}} 휴가가 승인되었습니다',
         '안녕하세요, {{recipient_name}}님.\n\n신청하신 휴가가 승인되었습니다.\n\n- 휴가유형: {{leave_type}}\n- 휴가기간: {{start_date}} ~ {{end_date}}\n- 일수: {{days_count}}일\n\n즐거운 휴가 보내세요!',
         '휴가 승인 시 발송되는 이메일', true, '["recipient_name", "leave_type", "start_date", "end_date", "days_count"]',
         NOW(), NOW(), 'system', 'system'),

        (v_tenant.id, 'LEAVE_APPROVED_PUSH', 'LEAVE', 'PUSH', '휴가 승인 푸시',
         NULL, '휴가가 승인되었습니다: {{start_date}} ~ {{end_date}}',
         '휴가 승인 푸시 알림', true, '["start_date", "end_date"]',
         NOW(), NOW(), 'system', 'system'),

        -- 근태 관련 알림
        (v_tenant.id, 'ATTENDANCE_LATE', 'ATTENDANCE', 'PUSH', '지각 알림',
         NULL, '오늘 {{late_minutes}}분 지각으로 처리되었습니다.',
         '지각 시 푸시 알림', true, '["late_minutes"]',
         NOW(), NOW(), 'system', 'system'),

        (v_tenant.id, 'ATTENDANCE_MISSING', 'ATTENDANCE', 'EMAIL', '출퇴근 미기록 알림',
         '[근태] 출퇴근 기록 확인 요청',
         '안녕하세요, {{recipient_name}}님.\n\n{{work_date}} 출퇴근 기록이 누락되어 있습니다.\n근태 시스템에서 확인해 주세요.',
         '출퇴근 미기록 시 이메일 알림', true, '["recipient_name", "work_date"]',
         NOW(), NOW(), 'system', 'system'),

        -- 공지사항 알림
        (v_tenant.id, 'ANNOUNCEMENT_NEW', 'ANNOUNCEMENT', 'EMAIL', '공지사항 알림',
         '[공지] {{announcement_title}}',
         '안녕하세요, {{recipient_name}}님.\n\n새로운 공지사항이 등록되었습니다.\n\n제목: {{announcement_title}}\n\n자세한 내용은 사내 포털에서 확인해 주세요.',
         '새 공지사항 등록 시 이메일 알림', true, '["recipient_name", "announcement_title"]',
         NOW(), NOW(), 'system', 'system'),

        (v_tenant.id, 'ANNOUNCEMENT_NEW_PUSH', 'ANNOUNCEMENT', 'PUSH', '공지사항 푸시',
         NULL, '새 공지: {{announcement_title}}',
         '새 공지사항 푸시 알림', true, '["announcement_title"]',
         NOW(), NOW(), 'system', 'system'),

        -- 생일/기념일 알림
        (v_tenant.id, 'BIRTHDAY_TODAY', 'BIRTHDAY', 'EMAIL', '생일 축하 알림',
         '🎂 생일을 축하합니다!',
         '{{recipient_name}}님, 생일을 진심으로 축하드립니다!\n\n행복하고 건강한 한 해 되시길 바랍니다.\n\n- ' || v_tenant.name || ' 임직원 일동',
         '생일 축하 이메일', true, '["recipient_name"]',
         NOW(), NOW(), 'system', 'system'),

        (v_tenant.id, 'ANNIVERSARY_REMINDER', 'ANNIVERSARY', 'PUSH', '입사 기념일 알림',
         NULL, '오늘은 {{employee_name}}님의 입사 {{years}}주년입니다!',
         '입사 기념일 푸시 알림', true, '["employee_name", "years"]',
         NOW(), NOW(), 'system', 'system'),

        -- 시스템 알림
        (v_tenant.id, 'SYSTEM_MAINTENANCE', 'SYSTEM', 'EMAIL', '시스템 점검 안내',
         '[안내] 시스템 점검 예정',
         '안녕하세요.\n\n시스템 점검이 예정되어 있습니다.\n\n- 점검일시: {{maintenance_date}}\n- 점검시간: {{maintenance_time}}\n- 예상소요: {{duration}}\n\n점검 시간 동안 서비스 이용이 제한될 수 있습니다.\n양해 부탁드립니다.',
         '시스템 점검 안내 이메일', true, '["maintenance_date", "maintenance_time", "duration"]',
         NOW(), NOW(), 'system', 'system'),

        -- 채용 관련 알림
        (v_tenant.id, 'RECRUITMENT_INTERVIEW_SCHEDULED', 'RECRUITMENT', 'EMAIL', '면접 일정 알림',
         '[면접안내] {{position_title}} 면접 일정',
         '안녕하세요, {{applicant_name}}님.\n\n지원해 주신 {{position_title}} 포지션의 면접 일정을 안내드립니다.\n\n- 일시: {{interview_date}} {{interview_time}}\n- 장소: {{interview_location}}\n- 면접유형: {{interview_type}}\n\n문의사항이 있으시면 연락 부탁드립니다.\n\n감사합니다.',
         '면접 일정 안내 이메일', true, '["applicant_name", "position_title", "interview_date", "interview_time", "interview_location", "interview_type"]',
         NOW(), NOW(), 'system', 'system'),

        (v_tenant.id, 'RECRUITMENT_OFFER_SENT', 'RECRUITMENT', 'EMAIL', '채용 제안 알림',
         '[채용제안] {{company_name}} 입사 제안드립니다',
         '안녕하세요, {{applicant_name}}님.\n\n{{company_name}}에서 {{position_title}} 포지션으로 입사를 제안드립니다.\n\n상세 내용은 첨부된 오퍼레터를 확인해 주세요.\n\n답변 기한: {{expires_at}}\n\n감사합니다.',
         '채용 제안 이메일', true, '["applicant_name", "company_name", "position_title", "expires_at"]',
         NOW(), NOW(), 'system', 'system');

    END LOOP;

    RAISE NOTICE '알림 템플릿 생성 완료';
END $$;

-- ============================================================================
-- 2. 직원 알림 설정 생성 (일부 직원)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_types TEXT[] := ARRAY['APPROVAL_REQUESTED', 'APPROVAL_APPROVED', 'LEAVE_REQUESTED', 'LEAVE_APPROVED', 'ANNOUNCEMENT', 'SYSTEM'];
    v_channels TEXT[] := ARRAY['EMAIL', 'WEB_PUSH'];
    v_type TEXT;
    v_channel TEXT;
BEGIN
    RAISE NOTICE '직원 알림 설정 생성 중...';

    -- 약 30%의 직원에게 알림 설정 생성
    FOR v_emp IN
        SELECT id, tenant_id, user_id
        FROM hr_core.employee
        WHERE status = 'ACTIVE'
        AND user_id IS NOT NULL
        AND RANDOM() < 0.3
        ORDER BY tenant_id, id
        LIMIT 20000
    LOOP
        FOREACH v_type IN ARRAY v_types LOOP
            FOREACH v_channel IN ARRAY v_channels LOOP
                INSERT INTO hr_notification.notification_preference (
                    id, tenant_id, user_id, notification_type, channel, enabled,
                    created_at, updated_at, created_by, updated_by
                ) VALUES (
                    gen_random_uuid(),
                    v_emp.tenant_id,
                    v_emp.user_id,
                    v_type,
                    v_channel,
                    -- 일부는 비활성화
                    CASE
                        WHEN v_type = 'SYSTEM' AND v_channel = 'WEB_PUSH' THEN RANDOM() < 0.5
                        WHEN v_type = 'ANNOUNCEMENT' AND v_channel = 'EMAIL' THEN RANDOM() < 0.8
                        ELSE true
                    END,
                    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
                );

                v_count := v_count + 1;
            END LOOP;
        END LOOP;

        IF v_count % 10000 = 0 THEN
            RAISE NOTICE '  알림 설정 %개 생성...', v_count;
        END IF;
    END LOOP;

    RAISE NOTICE '알림 설정 생성 완료: %개', v_count;
END $$;

-- ============================================================================
-- 3. 알림 데이터 생성 (최근 1개월)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_notification_type VARCHAR(50);
    v_title VARCHAR(500);
    v_content TEXT;
    v_created_at TIMESTAMP;
    v_is_read BOOLEAN;
BEGIN
    RAISE NOTICE '알림 데이터 생성 중...';

    -- 각 직원당 5-15개의 알림 생성
    FOR v_emp IN
        SELECT e.id, e.tenant_id, e.name, e.email
        FROM hr_core.employee e
        WHERE e.status = 'ACTIVE'
        AND RANDOM() < 0.4  -- 40%의 직원
        ORDER BY e.tenant_id, e.id
    LOOP
        FOR i IN 1..FLOOR(5 + RANDOM() * 11)::INT LOOP
            -- 허용된 notification_type만 사용
            v_notification_type := CASE FLOOR(RANDOM() * 6)::INT
                WHEN 0 THEN 'APPROVAL_REQUESTED'
                WHEN 1 THEN 'APPROVAL_APPROVED'
                WHEN 2 THEN 'LEAVE_APPROVED'
                WHEN 3 THEN 'ANNOUNCEMENT'
                WHEN 4 THEN 'SYSTEM'
                ELSE 'EMPLOYEE_JOINED'
            END;

            v_title := CASE v_notification_type
                WHEN 'APPROVAL_REQUESTED' THEN '새로운 결재 요청이 도착했습니다'
                WHEN 'APPROVAL_APPROVED' THEN '결재가 승인되었습니다'
                WHEN 'APPROVAL_REJECTED' THEN '결재가 반려되었습니다'
                WHEN 'LEAVE_APPROVED' THEN '휴가 신청이 승인되었습니다'
                WHEN 'ANNOUNCEMENT' THEN '새로운 공지사항이 등록되었습니다'
                WHEN 'SYSTEM' THEN '시스템 점검 안내'
                ELSE '새로운 직원이 입사했습니다'
            END;

            v_content := v_title || ' 상세 내용입니다.';
            v_created_at := NOW() - ((FLOOR(RANDOM() * 30))::INT || ' days')::INTERVAL - ((FLOOR(RANDOM() * 24))::INT || ' hours')::INTERVAL;
            v_is_read := RANDOM() < 0.7;  -- 70% 읽음

            INSERT INTO hr_notification.notification (
                id, tenant_id, recipient_id, recipient_email,
                notification_type, channel, title, content,
                link_url, is_read, read_at, is_sent, sent_at,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(),
                v_emp.tenant_id,
                v_emp.id,
                v_emp.email,
                v_notification_type,
                CASE WHEN RANDOM() < 0.6 THEN 'EMAIL' ELSE 'WEB_PUSH' END,
                v_title,
                v_content,
                CASE v_notification_type
                    WHEN 'APPROVAL_REQUESTED' THEN '/approval/inbox'
                    WHEN 'APPROVAL_APPROVED' THEN '/approval/inbox'
                    WHEN 'LEAVE_APPROVED' THEN '/attendance/leave'
                    WHEN 'ANNOUNCEMENT' THEN '/announcement'
                    ELSE NULL
                END,
                v_is_read,
                CASE WHEN v_is_read THEN v_created_at + INTERVAL '1 hour' ELSE NULL END,
                true,
                v_created_at,
                v_created_at, NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
            );

            v_count := v_count + 1;

            IF v_count % 50000 = 0 THEN
                RAISE NOTICE '  알림 %개 생성...', v_count;
            END IF;
        END LOOP;
    END LOOP;

    RAISE NOTICE '알림 생성 완료: %개', v_count;
END $$;

COMMIT;

-- 검증
DO $$
DECLARE
    v_template_count INT;
    v_preference_count INT;
    v_notification_count INT;
BEGIN
    SELECT COUNT(*) INTO v_template_count FROM hr_notification.notification_template;
    SELECT COUNT(*) INTO v_preference_count FROM hr_notification.notification_preference;
    SELECT COUNT(*) INTO v_notification_count FROM hr_notification.notification;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '알림 데이터 생성 결과';
    RAISE NOTICE '========================================';
    RAISE NOTICE '알림 템플릿 : %개', v_template_count;
    RAISE NOTICE '알림 설정   : %개', v_preference_count;
    RAISE NOTICE '알림        : %개', v_notification_count;
    RAISE NOTICE '========================================';
END $$;
