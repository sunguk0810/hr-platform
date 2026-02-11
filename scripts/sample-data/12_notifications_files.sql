-- ============================================================================
-- 12_notifications_files.sql
-- 알림 & 파일 메타데이터 샘플 데이터
-- ============================================================================
-- Tables:
--   notification_template (~128), notification_preference (~192)
--   notification (~150), file_metadata (~80)
-- Depends on: 01_tenants.sql, 05_employees.sql, 06_auth.sql
-- ============================================================================

RESET app.current_tenant;

BEGIN;

-- ============================================================================
-- PART 1: Notification Templates (16 types × 8 tenants = 128)
-- ============================================================================

DO $$
DECLARE
    v_tenant_ids UUID[] := ARRAY[
        'a0000001-0000-0000-0000-000000000001'::UUID,
        'a0000001-0000-0000-0000-000000000002'::UUID,
        'a0000001-0000-0000-0000-000000000003'::UUID,
        'a0000001-0000-0000-0000-000000000004'::UUID,
        'a0000001-0000-0000-0000-000000000005'::UUID,
        'a0000001-0000-0000-0000-000000000006'::UUID,
        'a0000001-0000-0000-0000-000000000007'::UUID,
        'a0000001-0000-0000-0000-000000000008'::UUID
    ];
    v_codes TEXT[] := ARRAY[
        'APPROVAL_REQUESTED','APPROVAL_COMPLETED','APPROVAL_REJECTED',
        'LEAVE_APPROVED','LEAVE_REJECTED',
        'ATTENDANCE_ANOMALY','OVERTIME_WARNING',
        'APPOINTMENT_NOTICE','CERTIFICATE_ISSUED',
        'ANNOUNCEMENT_NEW','BIRTHDAY_NOTICE',
        'PASSWORD_EXPIRY','ACCOUNT_LOCKED',
        'RECRUITMENT_INTERVIEW','OFFER_SENT',
        'SYSTEM_MAINTENANCE'
    ];
    v_types TEXT[] := ARRAY[
        'APPROVAL','APPROVAL','APPROVAL',
        'LEAVE','LEAVE',
        'ATTENDANCE','ATTENDANCE',
        'APPOINTMENT','CERTIFICATE',
        'ANNOUNCEMENT','HR',
        'SECURITY','SECURITY',
        'RECRUITMENT','RECRUITMENT',
        'SYSTEM'
    ];
    v_names TEXT[] := ARRAY[
        '결재 요청 알림','결재 완료 알림','결재 반려 알림',
        '휴가 승인 알림','휴가 반려 알림',
        '출퇴근 이상 알림','초과근무 경고',
        '발령 통보','증명서 발급 완료',
        '새 공지사항','생일 축하',
        '비밀번호 만료 예정','계정 잠금 알림',
        '면접 일정 알림','채용 오퍼 발송',
        '시스템 점검 안내'
    ];
    v_bodies TEXT[] := ARRAY[
        '{{drafter_name}}님이 {{document_title}} 결재를 요청했습니다.',
        '{{document_title}} 결재가 완료되었습니다.',
        '{{document_title}} 결재가 반려되었습니다. 사유: {{reason}}',
        '{{employee_name}}님의 휴가 신청이 승인되었습니다. ({{start_date}} ~ {{end_date}})',
        '{{employee_name}}님의 휴가 신청이 반려되었습니다. 사유: {{reason}}',
        '{{employee_name}}님의 {{date}} 출퇴근 기록에 이상이 감지되었습니다.',
        '{{employee_name}}님의 주간 근무시간이 {{hours}}시간입니다. 52시간 한도에 주의하세요.',
        '{{employee_name}}님에 대한 {{type}} 발령이 {{effective_date}}부 시행됩니다.',
        '요청하신 {{certificate_type}} 증명서가 발급되었습니다.',
        '새 공지사항이 등록되었습니다: {{title}}',
        '오늘은 {{employee_name}}님의 생일입니다. 축하해주세요!',
        '비밀번호 만료까지 {{days}}일 남았습니다. 변경해주세요.',
        '{{username}} 계정이 로그인 실패 {{count}}회로 잠금되었습니다.',
        '{{applicant_name}}님과의 면접이 {{date}} {{time}}에 예정되어 있습니다.',
        '{{applicant_name}}님에게 채용 오퍼가 발송되었습니다.',
        '{{date}} {{start_time}}~{{end_time}} 시스템 점검이 예정되어 있습니다.'
    ];
    i INT; j INT;
BEGIN
    FOR i IN 1..8 LOOP
        FOR j IN 1..16 LOOP
            INSERT INTO hr_notification.notification_template (
                id, tenant_id, code, notification_type, channel, name,
                subject, body_template, description, is_active, variables,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_tenant_ids[i],
                v_codes[j], v_types[j], 'IN_APP', v_names[j],
                v_names[j], v_bodies[j], v_names[j] || ' 템플릿',
                true, NULL,
                NOW(), NOW(), 'system', 'system'
            ) ON CONFLICT (tenant_id, code) DO NOTHING;
        END LOOP;
    END LOOP;
    RAISE NOTICE 'Created 128 notification templates';
END $$;

-- ============================================================================
-- PART 2: Notification Preferences (test accounts)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_users UUID[] := ARRAY[
        '00000002-0000-0000-0000-000000000001'::UUID,
        '00000002-0000-0000-0000-000000000002'::UUID,
        '00000002-0000-0000-0000-000000000003'::UUID,
        '00000002-0000-0000-0000-000000000004'::UUID,
        '00000002-0000-0000-0000-000000000005'::UUID,
        '00000002-0000-0000-0000-000000000006'::UUID
    ];
    v_types TEXT[] := ARRAY['APPROVAL','LEAVE','ATTENDANCE','APPOINTMENT','CERTIFICATE','ANNOUNCEMENT','HR','SECURITY','RECRUITMENT','SYSTEM'];
    v_channels TEXT[] := ARRAY['IN_APP','EMAIL'];
    i INT; j INT; k INT;
BEGIN
    FOR i IN 1..6 LOOP
        FOR j IN 1..10 LOOP
            FOR k IN 1..2 LOOP
                INSERT INTO hr_notification.notification_preference (
                    tenant_id, user_id, notification_type, channel, enabled,
                    created_at, updated_at, created_by, updated_by
                ) VALUES (
                    v_t, v_users[i], v_types[j], v_channels[k],
                    CASE WHEN k = 1 THEN true ELSE (j <= 4) END,
                    NOW(), NOW(), 'system', 'system'
                ) ON CONFLICT (tenant_id, user_id, notification_type, channel) DO NOTHING;
            END LOOP;
        END LOOP;
    END LOOP;
    RAISE NOTICE 'Created notification preferences for 6 test accounts';
END $$;

-- ============================================================================
-- PART 3: Notifications for Test Accounts
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    v_n TIMESTAMPTZ := NOW();
    -- user_ids for recipients
    v_staff UUID := '00000002-0000-0000-0000-000000000006';
    v_mgr   UUID := '00000002-0000-0000-0000-000000000004';
    v_hr    UUID := '00000002-0000-0000-0000-000000000002';
    v_ceo   UUID := '00000002-0000-0000-0000-000000000001';

BEGIN
    -- dev.staff.elec: 5 UNREAD + 10 READ = 15 notifications
    -- UNREAD
    INSERT INTO hr_notification.notification (tenant_id, recipient_id, notification_type, channel, title, content, link_url, is_read, is_sent, sent_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_t, v_staff, 'APPROVAL', 'IN_APP', '결재 완료 알림', '연차 휴가 신청 결재가 완료되었습니다.', '/approvals/c0000002-0000-0000-0000-000000000001', false, true, v_n - interval '1 hour', v_n - interval '1 hour', v_n - interval '1 hour', v_s, v_s),
    (v_t, v_staff, 'ANNOUNCEMENT', 'IN_APP', '새 공지사항', '2025년 설 연휴 근무 안내가 등록되었습니다.', '/announcements', false, true, v_n - interval '3 hours', v_n - interval '3 hours', v_n - interval '3 hours', v_s, v_s),
    (v_t, v_staff, 'HR', 'IN_APP', '생일 축하', '오늘은 강선임님의 생일입니다. 축하해주세요!', '/employees', false, true, v_n - interval '6 hours', v_n - interval '6 hours', v_n - interval '6 hours', v_s, v_s),
    (v_t, v_staff, 'ATTENDANCE', 'IN_APP', '출퇴근 이상 알림', '어제 퇴근 기록이 누락되었습니다.', '/attendance', false, true, v_n - interval '1 day', v_n - interval '1 day', v_n - interval '1 day', v_s, v_s),
    (v_t, v_staff, 'SECURITY', 'IN_APP', '비밀번호 만료 예정', '비밀번호 만료까지 7일 남았습니다. 변경해주세요.', '/settings/password', false, true, v_n - interval '2 days', v_n - interval '2 days', v_n - interval '2 days', v_s, v_s);

    -- READ
    INSERT INTO hr_notification.notification (tenant_id, recipient_id, notification_type, channel, title, content, is_read, read_at, is_sent, sent_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_t, v_staff, 'APPROVAL', 'IN_APP', '결재 요청 접수', '출장 신청서가 접수되었습니다.', true, v_n - interval '3 days', true, v_n - interval '4 days', v_n - interval '4 days', v_n - interval '3 days', v_s, v_s),
    (v_t, v_staff, 'LEAVE', 'IN_APP', '휴가 승인', '1/20~21 연차가 승인되었습니다.', true, v_n - interval '28 days', true, v_n - interval '29 days', v_n - interval '29 days', v_n - interval '28 days', v_s, v_s),
    (v_t, v_staff, 'ANNOUNCEMENT', 'IN_APP', '공지사항', '2025년 신년 인사 메시지', true, v_n - interval '40 days', true, v_n - interval '41 days', v_n - interval '41 days', v_n - interval '40 days', v_s, v_s),
    (v_t, v_staff, 'SYSTEM', 'IN_APP', '시스템 점검', '1/15 02:00~06:00 정기 점검', true, v_n - interval '27 days', true, v_n - interval '28 days', v_n - interval '28 days', v_n - interval '27 days', v_s, v_s),
    (v_t, v_staff, 'CERTIFICATE', 'IN_APP', '증명서 발급', '재직증명서가 발급되었습니다.', true, v_n - interval '15 days', true, v_n - interval '16 days', v_n - interval '16 days', v_n - interval '15 days', v_s, v_s),
    (v_t, v_staff, 'ATTENDANCE', 'IN_APP', '근태 확인', '1월 근태 마감 확인 요청', true, v_n - interval '10 days', true, v_n - interval '11 days', v_n - interval '11 days', v_n - interval '10 days', v_s, v_s),
    (v_t, v_staff, 'HR', 'IN_APP', '인사 안내', '2025년 건강검진 일정 안내', true, v_n - interval '20 days', true, v_n - interval '21 days', v_n - interval '21 days', v_n - interval '20 days', v_s, v_s),
    (v_t, v_staff, 'APPROVAL', 'IN_APP', '구매 신청 접수', '모니터 구매 신청이 접수되었습니다.', true, v_n - interval '5 hours', true, v_n - interval '5 hours', v_n - interval '5 hours', v_n - interval '4 hours', v_s, v_s),
    (v_t, v_staff, 'ANNOUNCEMENT', 'IN_APP', '공지사항', '2025년 복리후생 안내', true, v_n - interval '35 days', true, v_n - interval '36 days', v_n - interval '36 days', v_n - interval '35 days', v_s, v_s),
    (v_t, v_staff, 'SECURITY', 'IN_APP', '로그인 안내', '새 기기에서 로그인 감지', true, v_n - interval '7 days', true, v_n - interval '7 days', v_n - interval '7 days', v_n - interval '7 days', v_s, v_s);

    -- dev.manager.elec: 3 UNREAD (결재 요청)
    INSERT INTO hr_notification.notification (tenant_id, recipient_id, notification_type, channel, title, content, link_url, is_read, is_sent, sent_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_t, v_mgr, 'APPROVAL', 'IN_APP', '결재 요청', '강선임님이 연차 신청 결재를 요청했습니다.', '/approvals/c0000002-0000-0000-0000-000000000003', false, true, v_n - interval '1 day', v_n - interval '1 day', v_n - interval '1 day', v_s, v_s),
    (v_t, v_mgr, 'APPROVAL', 'IN_APP', '결재 요청', '강선임님이 초과근무 결재를 요청했습니다.', '/approvals/c0000002-0000-0000-0000-000000000004', false, true, v_n - interval '2 hours', v_n - interval '2 hours', v_n - interval '2 hours', v_s, v_s),
    (v_t, v_mgr, 'APPROVAL', 'IN_APP', '결재 요청', '조사원님이 구매신청 결재를 요청했습니다.', '/approvals/c0000002-0000-0000-0000-000000000005', false, true, v_n - interval '5 hours', v_n - interval '5 hours', v_n - interval '5 hours', v_s, v_s);

    -- hr.admin.elec: 2 UNREAD
    INSERT INTO hr_notification.notification (tenant_id, recipient_id, notification_type, channel, title, content, link_url, is_read, is_sent, sent_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_t, v_hr, 'APPROVAL', 'IN_APP', '결재 요청', '박인사님이 인사변경 결재를 요청했습니다.', '/approvals/c0000002-0000-0000-0000-000000000009', false, true, v_n - interval '4 hours', v_n - interval '4 hours', v_n - interval '4 hours', v_s, v_s),
    (v_t, v_hr, 'RECRUITMENT', 'IN_APP', '면접 일정 알림', '내일 14:00 프론트엔드 개발자 1차 면접이 예정되어 있습니다.', '/recruitment/interviews', false, true, v_n - interval '6 hours', v_n - interval '6 hours', v_n - interval '6 hours', v_s, v_s);

    -- ceo.elec: 1 UNREAD
    INSERT INTO hr_notification.notification (tenant_id, recipient_id, notification_type, channel, title, content, is_read, is_sent, sent_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_t, v_ceo, 'ANNOUNCEMENT', 'IN_APP', '2025년 1분기 경영 실적 보고서', '경영기획실에서 1분기 실적 보고서를 게시했습니다.', false, true, v_n - interval '2 hours', v_n - interval '2 hours', v_n - interval '2 hours', v_s, v_s);

    -- Bulk notifications for other tenants
    INSERT INTO hr_notification.notification (tenant_id, recipient_id, notification_type, channel, title, content, is_read, is_sent, sent_at, created_at, updated_at, created_by, updated_by)
    SELECT
        e.tenant_id,
        COALESCE(u.id, gen_random_uuid()),
        (ARRAY['APPROVAL','LEAVE','ATTENDANCE','ANNOUNCEMENT','SYSTEM'])[1 + (ROW_NUMBER() OVER() % 5)::INT],
        'IN_APP',
        '알림 ' || ROW_NUMBER() OVER(),
        '샘플 알림 내용입니다.',
        (ROW_NUMBER() OVER() % 3 != 0),
        true,
        NOW() - ((ROW_NUMBER() OVER() % 30) * interval '1 day'),
        NOW() - ((ROW_NUMBER() OVER() % 30) * interval '1 day'),
        NOW() - ((ROW_NUMBER() OVER() % 30) * interval '1 day'),
        'system', 'system'
    FROM hr_core.employee e
    LEFT JOIN tenant_common.users u ON u.employee_id = e.id
    WHERE e.tenant_id != 'a0000001-0000-0000-0000-000000000002'
      AND u.id IS NOT NULL
    LIMIT 80;

    RAISE NOTICE 'Created notifications for all test accounts';
END $$;

-- ============================================================================
-- PART 4: File Metadata
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    v_ref_types TEXT[] := ARRAY['PROFILE_PHOTO','APPROVAL_ATTACHMENT','ANNOUNCEMENT_ATTACHMENT','CERTIFICATE_PDF','RESUME','EMPLOYEE_DOCUMENT'];
    v_content_types TEXT[] := ARRAY['image/jpeg','application/pdf','application/pdf','application/pdf','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    v_names TEXT[] := ARRAY['profile.jpg','approval_doc.pdf','notice_attachment.pdf','certificate.pdf','resume.pdf','employment_contract.docx'];
    v_sizes BIGINT[] := ARRAY[245760, 1048576, 524288, 204800, 2097152, 153600];
    i INT; j INT;
    v_emp_id UUID;
    v_emp_name TEXT;
BEGIN
    -- Test account files
    FOR i IN 1..6 LOOP
        v_emp_id := ('e0000002-0000-0000-0000-' || LPAD(i::TEXT, 12, '0'))::UUID;
        SELECT name INTO v_emp_name FROM hr_core.employee WHERE id = v_emp_id;

        IF v_emp_name IS NULL THEN
            CONTINUE; -- Skip if employee not found
        END IF;

        FOR j IN 1..array_length(v_ref_types, 1) LOOP
            IF j > 3 AND i > 3 THEN CONTINUE; END IF; -- Not everyone has all file types

            INSERT INTO hr_file.file_metadata (
                tenant_id, original_name, stored_name, content_type, file_size,
                storage_path, bucket_name, storage_type, reference_type, reference_id,
                uploader_id, uploader_name, is_public, download_count, checksum,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_t,
                COALESCE(v_emp_name, 'unknown') || '_' || v_names[j],
                'elec/' || v_emp_id || '/' || gen_random_uuid() || '_' || v_names[j],
                v_content_types[j],
                v_sizes[j] + (i * 1024),
                'hr-platform-files/elec/' || v_ref_types[j] || '/' || v_emp_id,
                'hr-platform-files', 'S3',
                v_ref_types[j], v_emp_id,
                v_emp_id, v_emp_name,
                (j = 1), -- Only profile photos are public
                (CASE WHEN j <= 2 THEN i ELSE 0 END),
                md5(v_emp_id::TEXT || j::TEXT),
                NOW() - ((i * 10 + j) * interval '1 day'),
                NOW() - ((i * 10 + j) * interval '1 day'),
                v_s, v_s
            );
        END LOOP;
    END LOOP;

    -- Bulk files for other tenants
    INSERT INTO hr_file.file_metadata (
        tenant_id, original_name, stored_name, content_type, file_size,
        storage_path, bucket_name, storage_type, reference_type,
        uploader_id, uploader_name, created_at, updated_at, created_by, updated_by
    )
    SELECT
        e.tenant_id,
        e.name || '_profile.jpg',
        e.tenant_id || '/' || e.id || '/' || gen_random_uuid() || '.jpg',
        'image/jpeg',
        200000 + (ROW_NUMBER() OVER() * 1024),
        'hr-platform-files/' || e.tenant_id || '/PROFILE_PHOTO/' || e.id,
        'hr-platform-files', 'S3', 'PROFILE_PHOTO',
        e.id, e.name,
        NOW() - ((ROW_NUMBER() OVER() % 90) * interval '1 day'),
        NOW() - ((ROW_NUMBER() OVER() % 90) * interval '1 day'),
        'system', 'system'
    FROM hr_core.employee e
    WHERE e.tenant_id != 'a0000001-0000-0000-0000-000000000002'
    ORDER BY e.id
    LIMIT 50;

    RAISE NOTICE 'Created file metadata';
END $$;

COMMIT;

-- Verification
SELECT 'notification_template' as "table", COUNT(*)::TEXT as cnt FROM hr_notification.notification_template
UNION ALL SELECT 'notification_preference', COUNT(*)::TEXT FROM hr_notification.notification_preference
UNION ALL SELECT 'notification', COUNT(*)::TEXT FROM hr_notification.notification
UNION ALL SELECT 'file_metadata', COUNT(*)::TEXT FROM hr_file.file_metadata;
