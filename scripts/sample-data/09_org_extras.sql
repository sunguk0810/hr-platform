-- ============================================================================
-- 09_org_extras.sql
-- 조직 부가 데이터 (공지, 위원회, 정원, 경조, 전출입, 사원증)
-- ============================================================================
-- Tables:
--   announcement (~20), announcement_attachment (~5), announcement_target (~10)
--   announcement_read (~20), committee (~10), committee_member (~30)
--   headcount_plan (~30), headcount_request (~10)
--   condolence_policy (48), condolence_request (~30)
--   transfer_request (~10), employee_card (~30), card_issue_request (~10)
--   organization_history (~20)
-- Depends on: 01_tenants.sql, 04_organization.sql, 05_employees.sql
-- ============================================================================

RESET app.current_tenant;

BEGIN;

-- ============================================================================
-- PART 1: Announcements (공지사항)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    v_hr UUID;
    v_ceo UUID;
    v_ann_id UUID;
BEGIN
    -- Get actual employee IDs
    SELECT id INTO v_hr FROM hr_core.employee WHERE employee_number = 'E-2024-0002' AND tenant_id = v_t;
    SELECT id INTO v_ceo FROM hr_core.employee WHERE employee_number = 'E-2024-0001' AND tenant_id = v_t;

    -- Pinned: 설 연휴 안내 (dashboard visible)
    v_ann_id := gen_random_uuid();
    INSERT INTO hr_core.announcement (id, tenant_id, title, content, category, author_id, author_name, author_department, is_pinned, view_count, is_published, published_at, target_scope, created_at, updated_at, created_by, updated_by) VALUES
    (v_ann_id, v_t, '2025년 설 연휴 근무 안내', '설 연휴 기간(1/28~30) 근무 안내입니다. 필수 근무자 외 전 직원 휴무입니다.', 'NOTICE', v_hr, '김인사', '인사팀', true, 245, true, NOW()-interval '15 days', 'ALL', NOW()-interval '15 days', NOW(), v_s, v_s);
    INSERT INTO hr_core.announcement_target (announcement_id, target_type, target_id, target_name, created_at) VALUES
    (v_ann_id, 'ALL', v_t, '전체', NOW()-interval '15 days');

    -- Pinned: 신년 인사
    INSERT INTO hr_core.announcement (tenant_id, title, content, category, author_id, author_name, author_department, is_pinned, view_count, is_published, published_at, target_scope, created_at, updated_at, created_by, updated_by) VALUES
    (v_t, '2025년 신년 인사', '한성전자 임직원 여러분, 새해 복 많이 받으세요. 올해도 함께 성장하는 한성전자가 되겠습니다.', 'NOTICE', v_ceo, '이전자', '경영지원본부', true, 198, true, NOW()-interval '42 days', 'ALL', NOW()-interval '42 days', NOW(), v_s, v_s);

    -- Regular notices
    INSERT INTO hr_core.announcement (tenant_id, title, content, category, author_id, author_name, author_department, is_pinned, view_count, is_published, published_at, target_scope, created_at, updated_at, created_by, updated_by) VALUES
    (v_t, '2025년 건강검진 일정 안내', '2025년 건강검진이 3월부터 시작됩니다. 지정 병원 및 예약 방법을 확인해주세요.', 'HR', v_hr, '김인사', '인사팀', false, 156, true, NOW()-interval '20 days', 'ALL', NOW()-interval '20 days', NOW(), v_s, v_s),
    (v_t, '사내 동호회 모집 안내', '2025년 신규 동호회 및 기존 동호회 회원 모집 안내입니다.', 'EVENT', v_hr, '김인사', '인사팀', false, 89, true, NOW()-interval '25 days', 'ALL', NOW()-interval '25 days', NOW(), v_s, v_s),
    (v_t, '2025년 복리후생 변경 안내', '올해 변경되는 복리후생 제도를 안내드립니다. 자녀 학비 지원 확대 등.', 'HR', v_hr, '김인사', '인사팀', false, 201, true, NOW()-interval '35 days', 'ALL', NOW()-interval '35 days', NOW(), v_s, v_s),
    (v_t, '주차장 이용 안내', '지하 주차장 공사로 인해 2월 한 달간 지상 주차장을 이용해주세요.', 'GENERAL', v_hr, '김인사', '인사팀', false, 134, true, NOW()-interval '10 days', 'ALL', NOW()-interval '10 days', NOW(), v_s, v_s),
    (v_t, '정보보안 교육 안내', '연간 필수 정보보안 교육이 2/15~28 기간에 실시됩니다.', 'TRAINING', v_hr, '김인사', '인사팀', false, 78, true, NOW()-interval '8 days', 'ALL', NOW()-interval '8 days', NOW(), v_s, v_s),
    (v_t, '1분기 경영실적 보고', '2025년 1분기 경영 실적을 공유드립니다. 매출 전년 대비 12% 증가.', 'BUSINESS', v_ceo, '이전자', '경영지원본부', false, 67, true, NOW()-interval '3 days', 'ALL', NOW()-interval '3 days', NOW(), v_s, v_s),
    (v_t, '시스템 점검 안내 (2/15)', '2/15(토) 02:00~06:00 HR 시스템 정기 점검이 예정되어 있습니다.', 'SYSTEM', NULL, 'System', '전산팀', false, 45, true, NOW()-interval '5 days', 'ALL', NOW()-interval '5 days', NOW(), v_s, v_s),
    (v_t, '직원 추천 채용 보상금 안내 (Draft)', '직원 추천 채용 성공 시 보상금 지급 안내입니다.', 'HR', v_hr, '김인사', '인사팀', false, 0, false, NULL, 'ALL', NOW()-interval '1 day', NOW(), v_s, v_s);

    -- Read records for test accounts
    INSERT INTO hr_core.announcement_read (announcement_id, employee_id, read_at)
    SELECT a.id, e.id, NOW() - (random() * interval '10 days')
    FROM hr_core.announcement a
    CROSS JOIN (SELECT id FROM hr_core.employee WHERE id IN (
        'e0000002-0000-0000-0000-000000000004',
        'e0000002-0000-0000-0000-000000000005',
        'e0000002-0000-0000-0000-000000000006'
    )) e
    WHERE a.tenant_id = v_t AND a.is_published = true
    LIMIT 20
    ON CONFLICT (announcement_id, employee_id) DO NOTHING;

    -- Other tenants: 2 announcements each
    INSERT INTO hr_core.announcement (tenant_id, title, content, category, author_id, author_name, author_department, is_pinned, view_count, is_published, published_at, target_scope, created_at, updated_at, created_by, updated_by)
    SELECT
        t.id,
        CASE WHEN s.n = 1 THEN '2025년 신년 인사' ELSE '복리후생 안내' END,
        CASE WHEN s.n = 1 THEN '새해 복 많이 받으세요.' ELSE '복리후생 변경 안내입니다.' END,
        CASE WHEN s.n = 1 THEN 'NOTICE' ELSE 'HR' END,
        NULL, 'HR관리자', '인사팀',
        CASE WHEN s.n = 1 THEN true ELSE false END, s.n * 50, true, NOW() - (s.n * interval '20 days'), 'ALL',
        NOW() - (s.n * interval '20 days'), NOW(), 'system', 'system'
    FROM (
        SELECT tid, n
        FROM unnest(ARRAY[
            'a0000001-0000-0000-0000-000000000001'::UUID,
            'a0000001-0000-0000-0000-000000000003'::UUID,
            'a0000001-0000-0000-0000-000000000004'::UUID,
            'a0000001-0000-0000-0000-000000000005'::UUID,
            'a0000001-0000-0000-0000-000000000006'::UUID,
            'a0000001-0000-0000-0000-000000000007'::UUID,
            'a0000001-0000-0000-0000-000000000008'::UUID
        ]) as tid
        CROSS JOIN generate_series(1,2) as n
    ) s
    JOIN tenant_common.tenant t ON t.id = s.tid;

    RAISE NOTICE 'Created announcements';
END $$;

-- ============================================================================
-- PART 2: Committees (위원회)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    v_comm_id UUID;
BEGIN
    -- 산업안전보건위원회
    v_comm_id := gen_random_uuid();
    INSERT INTO hr_core.committee (id, tenant_id, code, name, name_en, type, purpose, start_date, meeting_schedule, status, created_at, updated_at, created_by, updated_by)
    VALUES (v_comm_id, v_t, 'SAFETY', '산업안전보건위원회', 'Safety Committee', 'STATUTORY', '근로자 안전 및 보건 관련 심의/의결', '2025-01-01', '분기별 1회', 'ACTIVE', NOW(), NOW(), v_s, v_s)
    ON CONFLICT (tenant_id, code) DO NOTHING;
    INSERT INTO hr_core.committee_member (committee_id, employee_id, employee_name, department_name, position_name, role, join_date, is_active, created_at, updated_at, created_by, updated_by) VALUES
    (v_comm_id, 'e0000002-0000-0000-0000-000000000001', '이전자', '경영지원본부', '대표이사', 'CHAIR', '2025-01-01', true, NOW(), NOW(), v_s, v_s),
    (v_comm_id, 'e0000002-0000-0000-0000-000000000002', '김인사', '인사팀', '팀장', 'SECRETARY', '2025-01-01', true, NOW(), NOW(), v_s, v_s),
    (v_comm_id, 'e0000002-0000-0000-0000-000000000004', '정개발', '개발1팀', '팀장', 'MEMBER', '2025-01-01', true, NOW(), NOW(), v_s, v_s);

    -- 인사위원회
    v_comm_id := gen_random_uuid();
    INSERT INTO hr_core.committee (id, tenant_id, code, name, name_en, type, purpose, start_date, meeting_schedule, status, created_at, updated_at, created_by, updated_by)
    VALUES (v_comm_id, v_t, 'HR_COMMITTEE', '인사위원회', 'HR Committee', 'INTERNAL', '인사 관련 주요 사항 심의', '2025-01-01', '월 1회', 'ACTIVE', NOW(), NOW(), v_s, v_s)
    ON CONFLICT (tenant_id, code) DO NOTHING;
    INSERT INTO hr_core.committee_member (committee_id, employee_id, employee_name, department_name, position_name, role, join_date, is_active, created_at, updated_at, created_by, updated_by) VALUES
    (v_comm_id, 'e0000002-0000-0000-0000-000000000001', '이전자', '경영지원본부', '대표이사', 'CHAIR', '2025-01-01', true, NOW(), NOW(), v_s, v_s),
    (v_comm_id, 'e0000002-0000-0000-0000-000000000002', '김인사', '인사팀', '팀장', 'MEMBER', '2025-01-01', true, NOW(), NOW(), v_s, v_s),
    (v_comm_id, 'e0000002-0000-0000-0000-000000000003', '박인사', '인사팀', '책임', 'SECRETARY', '2025-01-01', true, NOW(), NOW(), v_s, v_s);

    -- 징계위원회 (INACTIVE)
    v_comm_id := gen_random_uuid();
    INSERT INTO hr_core.committee (id, tenant_id, code, name, type, purpose, start_date, end_date, status, created_at, updated_at, created_by, updated_by)
    VALUES (v_comm_id, v_t, 'DISCIPLINE', '징계위원회', 'INTERNAL', '징계 사안 심의', '2024-01-01', '2024-12-31', 'INACTIVE', NOW(), NOW(), v_s, v_s)
    ON CONFLICT (tenant_id, code) DO NOTHING;

    RAISE NOTICE 'Created committees';
END $$;

-- ============================================================================
-- PART 3: Headcount Plans & Requests (정원관리)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    r RECORD;
BEGIN
    -- Headcount plans for 한성전자 leaf departments
    FOR r IN
        SELECT d.id, d.name
        FROM hr_core.department d
        WHERE d.tenant_id = v_t AND d.level >= 2 AND d.status = 'ACTIVE'
        ORDER BY d.id
        LIMIT 20
    LOOP
        INSERT INTO hr_core.headcount_plan (
            tenant_id, year, department_id, department_name,
            planned_count, current_count, approved_count,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            v_t, 2025, r.id, r.name,
            5 + (random() * 15)::INT,
            (SELECT COUNT(*) FROM hr_core.employee WHERE department_id = r.id AND tenant_id = v_t AND status = 'ACTIVE'),
            4 + (random() * 12)::INT,
            NOW(), NOW(), v_s, v_s
        ) ON CONFLICT (tenant_id, year, department_id) DO NOTHING;
    END LOOP;

    -- Headcount requests
    INSERT INTO hr_core.headcount_request (tenant_id, department_id, department_name, type, request_count, reason, effective_date, status, requester_id, requester_name, created_at, updated_at, created_by, updated_by) VALUES
    (v_t, 'd0000002-0000-0000-0000-000000000016', '개발1팀', 'INCREASE', 2, '프로젝트 확장에 따른 인원 충원', '2025-03-01', 'APPROVED', 'e0000002-0000-0000-0000-000000000004', '정개발', NOW()-interval '20 days', NOW(), v_s, v_s),
    (v_t, 'd0000002-0000-0000-0000-000000000017', '개발2팀', 'INCREASE', 1, '신규 프로젝트 투입', '2025-04-01', 'PENDING', 'e0000002-0000-0000-0000-000000000002', '김인사', NOW()-interval '5 days', NOW(), v_s, v_s),
    (v_t, 'd0000002-0000-0000-0000-000000000022', '국내영업팀', 'DECREASE', 1, '업무 자동화에 따른 감축', '2025-06-01', 'DRAFT', 'e0000002-0000-0000-0000-000000000002', '김인사', NOW()-interval '2 days', NOW(), v_s, v_s),
    (v_t, 'd0000002-0000-0000-0000-000000000018', 'QA팀', 'INCREASE', 2, 'QA 자동화 인력 충원', '2025-03-01', 'REJECTED', 'e0000002-0000-0000-0000-000000000002', '김인사', NOW()-interval '30 days', NOW(), v_s, v_s);

    RAISE NOTICE 'Created headcount plans and requests';
END $$;

-- ============================================================================
-- PART 4: Condolence Policies & Requests (경조사)
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
    v_event_types TEXT[] := ARRAY['MARRIAGE','CHILD_MARRIAGE','PARENT_DEATH','SPOUSE_DEATH','CHILD_BIRTH','FIRST_BIRTHDAY'];
    v_names TEXT[] := ARRAY['본인 결혼','자녀 결혼','부모 상','배우자 상','출산','첫돌'];
    v_amounts DECIMAL[] := ARRAY[500000, 300000, 500000, 500000, 200000, 100000];
    v_leave_days INT[] := ARRAY[5, 1, 5, 5, 3, 0];
    v_tid UUID;
    v_policy_id UUID;
    i INT; j INT;
BEGIN
    -- Policies for all tenants (6 types × 8 = 48)
    FOR i IN 1..8 LOOP
        v_tid := v_tenant_ids[i];
        FOR j IN 1..6 LOOP
            INSERT INTO hr_core.condolence_policy (
                tenant_id, event_type, name, description, amount, leave_days,
                is_active, sort_order, created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_tid, v_event_types[j], v_names[j],
                v_names[j] || ' 경조금 및 휴가 지급',
                v_amounts[j], v_leave_days[j],
                true, j, NOW(), NOW(), 'system', 'system'
            );
        END LOOP;
    END LOOP;

    -- Requests for 한성전자
    v_tid := 'a0000001-0000-0000-0000-000000000002';

    SELECT id INTO v_policy_id FROM hr_core.condolence_policy WHERE tenant_id = v_tid AND event_type = 'MARRIAGE' LIMIT 1;
    INSERT INTO hr_core.condolence_request (tenant_id, employee_id, employee_name, department_name, policy_id, event_type, event_date, description, relation, related_person_name, amount, leave_days, status, paid_date, created_at, updated_at, created_by, updated_by) VALUES
    (v_tid, 'e0000002-0000-0000-0000-000000000005', '강선임', '개발1팀', v_policy_id, 'MARRIAGE', '2025-05-10', '본인 결혼식', 'SELF', '강선임', 500000, 5, 'APPROVED', NULL, NOW()-interval '5 days', NOW(), 'system', 'system');

    SELECT id INTO v_policy_id FROM hr_core.condolence_policy WHERE tenant_id = v_tid AND event_type = 'PARENT_DEATH' LIMIT 1;
    INSERT INTO hr_core.condolence_request (tenant_id, employee_id, employee_name, department_name, policy_id, event_type, event_date, description, relation, related_person_name, amount, leave_days, status, paid_date, created_at, updated_at, created_by, updated_by) VALUES
    (v_tid, gen_random_uuid(), '임정우', '개발2팀', v_policy_id, 'PARENT_DEATH', '2025-01-20', '부친상', 'FATHER', '임OO', 500000, 5, 'PAID', '2025-01-22', NOW()-interval '25 days', NOW(), 'system', 'system');

    SELECT id INTO v_policy_id FROM hr_core.condolence_policy WHERE tenant_id = v_tid AND event_type = 'CHILD_BIRTH' LIMIT 1;
    INSERT INTO hr_core.condolence_request (tenant_id, employee_id, employee_name, department_name, policy_id, event_type, event_date, description, relation, related_person_name, amount, leave_days, status, created_at, updated_at, created_by, updated_by) VALUES
    (v_tid, gen_random_uuid(), '한서연', '해외영업팀', v_policy_id, 'CHILD_BIRTH', '2025-02-05', '둘째 출산', 'CHILD', '한OO', 200000, 3, 'PENDING', NOW()-interval '6 days', NOW(), 'system', 'system');

    RAISE NOTICE 'Created condolence policies and requests';
END $$;

-- ============================================================================
-- PART 5: Transfer Requests (계열사 전출입)
-- ============================================================================

DO $$
DECLARE
    v_s TEXT := 'system';
BEGIN
    INSERT INTO hr_core.transfer_request (
        tenant_id, employee_name, employee_number,
        source_tenant_id, source_tenant_name, source_department_name, source_position_name, source_grade_name,
        target_tenant_id, target_tenant_name, target_department_name, target_position_name, target_grade_name,
        transfer_date, reason, status,
        source_approver_name, source_approved_at, target_approver_name, target_approved_at,
        completed_at, created_at, updated_at, created_by, updated_by
    ) VALUES
    -- Completed: 한성전자 → 한성SDI
    ('a0000001-0000-0000-0000-000000000002', '김이동', 'E-2024-0050',
     'a0000001-0000-0000-0000-000000000002', '한성전자', '개발2팀', '선임', '대리',
     'a0000001-0000-0000-0000-000000000003', '한성SDI', '배터리개발팀', '선임', '대리',
     '2025-01-15', '배터리 기술 지원', 'COMPLETED',
     '김인사', NOW()-interval '45 days', 'SDI HR', NOW()-interval '40 days',
     NOW()-interval '35 days', NOW()-interval '50 days', NOW(), v_s, v_s),
    -- Pending: 한성SDI → 한성전자
    ('a0000001-0000-0000-0000-000000000003', '박이직', 'S-2024-0030',
     'a0000001-0000-0000-0000-000000000003', '한성SDI', '품질관리팀', '팀원', '사원',
     'a0000001-0000-0000-0000-000000000002', '한성전자', 'QA팀', '팀원', '사원',
     '2025-03-01', 'QA 역량 활용', 'PENDING',
     'SDI HR', NOW()-interval '10 days', NULL, NULL,
     NULL, NOW()-interval '15 days', NOW(), v_s, v_s),
    -- Draft: 한성홀딩스 → 한성생명
    ('a0000001-0000-0000-0000-000000000001', '최전근', 'H-2024-0010',
     'a0000001-0000-0000-0000-000000000001', '한성홀딩스', '전략기획팀', '책임', '과장',
     'a0000001-0000-0000-0000-000000000008', '한성생명', '경영기획팀', '책임', '과장',
     '2025-04-01', '계열사 경영 지원', 'DRAFT',
     NULL, NULL, NULL, NULL,
     NULL, NOW()-interval '5 days', NOW(), v_s, v_s);

    RAISE NOTICE 'Created transfer requests';
END $$;

-- ============================================================================
-- PART 6: Employee Cards (사원증)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
BEGIN
    -- Cards for test accounts
    INSERT INTO hr_core.employee_card (tenant_id, card_number, employee_id, status, issue_type, issue_date, expiry_date, access_level, rfid_enabled, created_at, updated_at, created_by, updated_by) VALUES
    (v_t, 'ELEC-CARD-0001', 'e0000002-0000-0000-0000-000000000001', 'ACTIVE', 'NEW', '2024-01-02', '2029-01-02', 'LEVEL_3', true, NOW(), NOW(), v_s, v_s),
    (v_t, 'ELEC-CARD-0002', 'e0000002-0000-0000-0000-000000000002', 'ACTIVE', 'NEW', '2024-01-02', '2029-01-02', 'LEVEL_2', true, NOW(), NOW(), v_s, v_s),
    (v_t, 'ELEC-CARD-0003', 'e0000002-0000-0000-0000-000000000003', 'ACTIVE', 'NEW', '2024-01-02', '2029-01-02', 'LEVEL_2', true, NOW(), NOW(), v_s, v_s),
    (v_t, 'ELEC-CARD-0004', 'e0000002-0000-0000-0000-000000000004', 'ACTIVE', 'NEW', '2024-01-02', '2029-01-02', 'LEVEL_2', true, NOW(), NOW(), v_s, v_s),
    (v_t, 'ELEC-CARD-0005', 'e0000002-0000-0000-0000-000000000005', 'ACTIVE', 'NEW', '2024-01-02', '2029-01-02', 'LEVEL_1', true, NOW(), NOW(), v_s, v_s),
    (v_t, 'ELEC-CARD-0006', 'e0000002-0000-0000-0000-000000000006', 'ACTIVE', 'NEW', '2024-01-02', '2029-01-02', 'LEVEL_1', true, NOW(), NOW(), v_s, v_s);

    -- A lost card and reissue request
    INSERT INTO hr_core.employee_card (tenant_id, card_number, employee_id, status, issue_type, issue_date, expiry_date, access_level, lost_at, lost_location, lost_description, created_at, updated_at, created_by, updated_by) VALUES
    (v_t, 'ELEC-CARD-0050', gen_random_uuid(), 'LOST', 'NEW', '2024-03-01', '2029-03-01', 'LEVEL_1', NOW()-interval '10 days', '사내 식당', '식당에서 분실', NOW()-interval '300 days', NOW()-interval '10 days', v_s, v_s);

    INSERT INTO hr_core.card_issue_request (tenant_id, request_number, employee_id, issue_type, reason, status, created_at, updated_at, created_by, updated_by)
    SELECT v_t, 'ELEC-CIR-2025-0001',
           ec.employee_id, 'REISSUE', '사원증 분실 재발급 요청', 'PENDING',
           NOW()-interval '9 days', NOW(), v_s, v_s
    FROM hr_core.employee_card ec
    WHERE ec.tenant_id = v_t AND ec.status = 'LOST'
    LIMIT 1;

    RAISE NOTICE 'Created employee cards and issue requests';
END $$;

-- ============================================================================
-- PART 7: Organization History
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    v_hr UUID := 'e0000002-0000-0000-0000-000000000002';
BEGIN
    INSERT INTO hr_core.organization_history (tenant_id, event_type, department_id, department_name, title, description, previous_value, new_value, actor_id, actor_name, event_date, created_at) VALUES
    (v_t, 'DEPARTMENT_CREATED', 'd0000002-0000-0000-0000-000000000033', '구조조정부', '구조조정부 신설', '구조조정 업무를 위한 임시 부서 신설', NULL, '{"name":"구조조정부","status":"ACTIVE"}'::JSONB, v_hr, '김인사', NOW()-interval '180 days', NOW()-interval '180 days'),
    (v_t, 'DEPARTMENT_DEACTIVATED', 'd0000002-0000-0000-0000-000000000033', '구조조정부', '구조조정부 비활성화', '구조조정 완료에 따른 부서 비활성화', '{"status":"ACTIVE"}'::JSONB, '{"status":"INACTIVE"}'::JSONB, v_hr, '김인사', NOW()-interval '60 days', NOW()-interval '60 days'),
    (v_t, 'MANAGER_CHANGED', 'd0000002-0000-0000-0000-000000000016', '개발1팀', '개발1팀 팀장 변경', '개발1팀 팀장 정개발 부임', '{"manager":"이전팀장"}'::JSONB, '{"manager":"정개발"}'::JSONB, v_hr, '김인사', NOW()-interval '365 days', NOW()-interval '365 days'),
    (v_t, 'DEPARTMENT_RENAMED', 'd0000002-0000-0000-0000-000000000031', '디자인팀', '디자인팀 명칭 변경', 'UX디자인팀에서 디자인팀으로 변경', '{"name":"UX디자인팀"}'::JSONB, '{"name":"디자인팀"}'::JSONB, v_hr, '김인사', NOW()-interval '200 days', NOW()-interval '200 days');

    RAISE NOTICE 'Created organization history';
END $$;

COMMIT;

-- Verification
SELECT 'announcement' as "table", COUNT(*)::TEXT as cnt FROM hr_core.announcement
UNION ALL SELECT 'announcement_target', COUNT(*)::TEXT FROM hr_core.announcement_target
UNION ALL SELECT 'announcement_read', COUNT(*)::TEXT FROM hr_core.announcement_read
UNION ALL SELECT 'committee', COUNT(*)::TEXT FROM hr_core.committee
UNION ALL SELECT 'committee_member', COUNT(*)::TEXT FROM hr_core.committee_member
UNION ALL SELECT 'headcount_plan', COUNT(*)::TEXT FROM hr_core.headcount_plan
UNION ALL SELECT 'headcount_request', COUNT(*)::TEXT FROM hr_core.headcount_request
UNION ALL SELECT 'condolence_policy', COUNT(*)::TEXT FROM hr_core.condolence_policy
UNION ALL SELECT 'condolence_request', COUNT(*)::TEXT FROM hr_core.condolence_request
UNION ALL SELECT 'transfer_request', COUNT(*)::TEXT FROM hr_core.transfer_request
UNION ALL SELECT 'employee_card', COUNT(*)::TEXT FROM hr_core.employee_card
UNION ALL SELECT 'card_issue_request', COUNT(*)::TEXT FROM hr_core.card_issue_request
UNION ALL SELECT 'organization_history', COUNT(*)::TEXT FROM hr_core.organization_history;
