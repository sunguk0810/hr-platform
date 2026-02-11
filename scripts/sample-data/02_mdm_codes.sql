-- ============================================================================
-- 02_mdm_codes.sql
-- MDM 공통코드 그룹 및 공통코드 통합 생성 (시스템 코드)
-- 코드그룹 20개 + 공통코드 ~128개 + 테넌트 매핑 3건
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: 시스템 공통코드 그룹 (is_system = true, tenant_id = NULL)
-- ============================================================================

-- 1. 고용유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000001', NULL,
    'EMPLOYMENT_TYPE', '고용유형', 'Employment Type',
    '정규직, 계약직 등 고용 형태 분류',
    true, false, 1, 'ACTIVE', true, 1,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 2. 직원상태
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000002', NULL,
    'EMPLOYEE_STATUS', '직원상태', 'Employee Status',
    '재직, 휴직, 퇴직 등 직원 상태 분류',
    true, false, 1, 'ACTIVE', true, 2,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 3. 부서상태
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000003', NULL,
    'DEPARTMENT_STATUS', '부서상태', 'Department Status',
    '활성, 비활성 등 부서 상태 분류',
    true, false, 1, 'ACTIVE', true, 3,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 4. 휴가유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000004', NULL,
    'LEAVE_TYPE', '휴가유형', 'Leave Type',
    '연차, 병가, 경조사 등 휴가 유형 분류',
    true, false, 1, 'ACTIVE', true, 4,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 5. 근태상태
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000005', NULL,
    'ATTENDANCE_STATUS', '근태상태', 'Attendance Status',
    '정상, 지각, 결근 등 근태 상태 분류',
    true, false, 1, 'ACTIVE', true, 5,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 6. 결재문서유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000006', NULL,
    'APPROVAL_DOC_TYPE', '결재문서유형', 'Approval Document Type',
    '휴가신청, 경비청구 등 결재 문서 유형 분류',
    true, false, 1, 'ACTIVE', true, 6,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 7. 결재상태
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000007', NULL,
    'APPROVAL_STATUS', '결재상태', 'Approval Status',
    '대기, 진행중, 승인, 반려 등 결재 상태 분류',
    true, false, 1, 'ACTIVE', true, 7,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 8. 가족관계
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000008', NULL,
    'RELATION_TYPE', '가족관계', 'Family Relation Type',
    '배우자, 자녀, 부모 등 가족 관계 분류',
    true, false, 1, 'ACTIVE', true, 8,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 9. 학위유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000009', NULL,
    'DEGREE_TYPE', '학위유형', 'Degree Type',
    '고졸, 학사, 석사, 박사 등 학위 분류',
    true, false, 1, 'ACTIVE', true, 9,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 10. 알림유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000010', NULL,
    'NOTIFICATION_TYPE', '알림유형', 'Notification Type',
    '결재, 일정, 공지 등 알림 유형 분류',
    true, false, 1, 'ACTIVE', true, 10,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 11. 휴일유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000011', NULL,
    'HOLIDAY_TYPE', '휴일유형', 'Holiday Type',
    '국경일, 공휴일, 창립기념일 등 휴일 유형 분류',
    true, false, 1, 'ACTIVE', true, 11,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 12. 성별
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000012', NULL,
    'GENDER', '성별', 'Gender',
    '남성, 여성 등 성별 분류',
    true, false, 1, 'ACTIVE', true, 12,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 13. 병역구분
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000013', NULL,
    'MILITARY_STATUS', '병역구분', 'Military Status',
    '군필, 미필, 면제 등 병역 상태 분류',
    true, false, 1, 'ACTIVE', true, 13,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 14. 업종분류 (계층형)
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000014', NULL,
    'INDUSTRY_TYPE', '업종분류', 'Industry Type',
    '제조업, IT, 금융 등 업종 분류',
    true, true, 2, 'ACTIVE', true, 14,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 15. 초과근무유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000015', NULL,
    'OVERTIME_TYPE', '초과근무유형', 'Overtime Type',
    '연장근무, 휴일근무, 야간근무 등 초과근무 분류',
    true, false, 1, 'ACTIVE', true, 15,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 16. 경조사유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000016', NULL,
    'CONDOLENCE_TYPE', '경조사유형', 'Condolence Type',
    '결혼, 출산, 부고 등 경조사 유형 분류',
    true, false, 1, 'ACTIVE', true, 16,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 17. 출장유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000017', NULL,
    'BUSINESS_TRIP_TYPE', '출장유형', 'Business Trip Type',
    '국내출장, 해외출장 등 출장 유형 분류',
    true, false, 1, 'ACTIVE', true, 17,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 18. 은행코드
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000018', NULL,
    'BANK_CODE', '은행코드', 'Bank Code',
    '급여이체 등에 사용되는 은행 코드',
    true, false, 1, 'ACTIVE', true, 18,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 19. 지역코드 (계층형)
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000019', NULL,
    'REGION_CODE', '지역코드', 'Region Code',
    '시도/시군구 등 지역 코드',
    true, true, 2, 'ACTIVE', true, 19,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 20. 근무지유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000020', NULL,
    'WORK_LOCATION_TYPE', '근무지유형', 'Work Location Type',
    '사무실, 재택, 현장 등 근무 장소 유형',
    true, false, 1, 'ACTIVE', true, 20,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;


-- ============================================================================
-- PART 2: 공통코드 상세 데이터
-- ============================================================================

-- ============================================================================
-- 1. 고용유형 (EMPLOYMENT_TYPE) - 5건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', NULL, NULL, 1,
     'FULL_TIME', '정규직', 'Full-time', '기간의 정함이 없는 정규 고용',
     true, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', NULL, NULL, 1,
     'CONTRACT', '계약직', 'Contract', '기간의 정함이 있는 계약 고용',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000001', NULL, NULL, 1,
     'INTERN', '인턴', 'Intern', '인턴십 고용',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000001', NULL, NULL, 1,
     'DISPATCH', '파견직', 'Dispatch', '파견 근로자',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000001', NULL, NULL, 1,
     'ADVISOR', '촉탁직', 'Advisor', '촉탁 계약 고용',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. 직원상태 (EMPLOYEE_STATUS) - 5건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000006', 'c0000001-0000-0000-0000-000000000002', NULL, NULL, 1,
     'ACTIVE', '재직', 'Active', '현재 재직중',
     true, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000007', 'c0000001-0000-0000-0000-000000000002', NULL, NULL, 1,
     'ON_LEAVE', '휴직', 'On Leave', '휴직 중',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000008', 'c0000001-0000-0000-0000-000000000002', NULL, NULL, 1,
     'RESIGNED', '퇴직', 'Resigned', '퇴직 (자발적/비자발적)',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000009', 'c0000001-0000-0000-0000-000000000002', NULL, NULL, 1,
     'SUSPENDED', '정직', 'Suspended', '정직 처분',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000010', 'c0000001-0000-0000-0000-000000000002', NULL, NULL, 1,
     'STANDBY', '대기', 'Standby', '대기 발령',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. 부서상태 (DEPARTMENT_STATUS) - 3건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000011', 'c0000001-0000-0000-0000-000000000003', NULL, NULL, 1,
     'ACTIVE', '활성', 'Active', '정상 운영중인 부서',
     true, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000012', 'c0000001-0000-0000-0000-000000000003', NULL, NULL, 1,
     'INACTIVE', '비활성', 'Inactive', '비활성화된 부서',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000013', 'c0000001-0000-0000-0000-000000000003', NULL, NULL, 1,
     'ABOLISHED', '폐지', 'Abolished', '폐지된 부서',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. 휴가유형 (LEAVE_TYPE) - 11건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000014', 'c0000001-0000-0000-0000-000000000004', NULL, NULL, 1,
     'ANNUAL', '연차', 'Annual Leave', '연간 기본 휴가',
     true, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000015', 'c0000001-0000-0000-0000-000000000004', NULL, NULL, 1,
     'HALF_DAY_AM', '오전반차', 'Half Day AM', '오전 반일 휴가',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000016', 'c0000001-0000-0000-0000-000000000004', NULL, NULL, 1,
     'HALF_DAY_PM', '오후반차', 'Half Day PM', '오후 반일 휴가',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000017', 'c0000001-0000-0000-0000-000000000004', NULL, NULL, 1,
     'SICK', '병가', 'Sick Leave', '질병으로 인한 휴가',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000018', 'c0000001-0000-0000-0000-000000000004', NULL, NULL, 1,
     'CONDOLENCE', '경조사', 'Condolence Leave', '경조사 휴가',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000019', 'c0000001-0000-0000-0000-000000000004', NULL, NULL, 1,
     'MATERNITY', '출산', 'Maternity Leave', '출산 전후 휴가',
     false, 'ACTIVE', true, 6,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000020', 'c0000001-0000-0000-0000-000000000004', NULL, NULL, 1,
     'PATERNITY', '배우자출산', 'Paternity Leave', '배우자 출산 휴가',
     false, 'ACTIVE', true, 7,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000021', 'c0000001-0000-0000-0000-000000000004', NULL, NULL, 1,
     'SPECIAL', '특별', 'Special Leave', '회사 부여 특별 휴가',
     false, 'ACTIVE', true, 8,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000022', 'c0000001-0000-0000-0000-000000000004', NULL, NULL, 1,
     'REFRESH', '리프레시', 'Refresh Leave', '장기근속 리프레시 휴가',
     false, 'ACTIVE', true, 9,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000023', 'c0000001-0000-0000-0000-000000000004', NULL, NULL, 1,
     'COMPENSATION', '보상', 'Compensation Leave', '보상 휴가 (초과근무 대체)',
     false, 'ACTIVE', true, 10,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000024', 'c0000001-0000-0000-0000-000000000004', NULL, NULL, 1,
     'UNPAID', '무급', 'Unpaid Leave', '무급 휴가',
     false, 'ACTIVE', true, 11,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. 근태상태 (ATTENDANCE_STATUS) - 6건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000025', 'c0000001-0000-0000-0000-000000000005', NULL, NULL, 1,
     'NORMAL', '정상', 'Normal', '정상 출퇴근',
     true, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000026', 'c0000001-0000-0000-0000-000000000005', NULL, NULL, 1,
     'LATE', '지각', 'Late', '출근 시간 지각',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000027', 'c0000001-0000-0000-0000-000000000005', NULL, NULL, 1,
     'EARLY_LEAVE', '조퇴', 'Early Leave', '퇴근 시간 조퇴',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000028', 'c0000001-0000-0000-0000-000000000005', NULL, NULL, 1,
     'ABSENT', '결근', 'Absent', '무단 결근',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000029', 'c0000001-0000-0000-0000-000000000005', NULL, NULL, 1,
     'BUSINESS_TRIP', '출장', 'Business Trip', '출장 중',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000030', 'c0000001-0000-0000-0000-000000000005', NULL, NULL, 1,
     'REMOTE', '재택', 'Remote Work', '재택/원격 근무',
     false, 'ACTIVE', true, 6,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. 결재문서유형 (APPROVAL_DOC_TYPE) - 8건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000031', 'c0000001-0000-0000-0000-000000000006', NULL, NULL, 1,
     'LEAVE_REQUEST', '휴가신청서', 'Leave Request', '휴가 신청 결재',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000032', 'c0000001-0000-0000-0000-000000000006', NULL, NULL, 1,
     'OVERTIME_REQUEST', '초과근무신청서', 'Overtime Request', '초과근무 신청 결재',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000033', 'c0000001-0000-0000-0000-000000000006', NULL, NULL, 1,
     'BUSINESS_TRIP', '출장신청서', 'Business Trip Request', '출장 신청 결재',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000034', 'c0000001-0000-0000-0000-000000000006', NULL, NULL, 1,
     'EXPENSE_CLAIM', '경비청구서', 'Expense Claim', '경비 청구 결재',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000035', 'c0000001-0000-0000-0000-000000000006', NULL, NULL, 1,
     'PURCHASE_REQUEST', '구매요청서', 'Purchase Request', '물품 구매 요청 결재',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000036', 'c0000001-0000-0000-0000-000000000006', NULL, NULL, 1,
     'PERSONNEL_CHANGE', '인사변경요청서', 'Personnel Change', '인사 관련 변경 결재',
     false, 'ACTIVE', true, 6,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000037', 'c0000001-0000-0000-0000-000000000006', NULL, NULL, 1,
     'CONDOLENCE_REQUEST', '경조금신청서', 'Condolence Request', '경조금 신청 결재',
     false, 'ACTIVE', true, 7,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000038', 'c0000001-0000-0000-0000-000000000006', NULL, NULL, 1,
     'GENERAL_APPROVAL', '일반품의서', 'General Approval', '일반 결재 문서',
     false, 'ACTIVE', true, 8,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. 결재상태 (APPROVAL_STATUS) - 7건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000039', 'c0000001-0000-0000-0000-000000000007', NULL, NULL, 1,
     'DRAFT', '임시저장', 'Draft', '작성 중 임시 저장',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000040', 'c0000001-0000-0000-0000-000000000007', NULL, NULL, 1,
     'PENDING', '대기', 'Pending', '상신 후 결재 대기',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000041', 'c0000001-0000-0000-0000-000000000007', NULL, NULL, 1,
     'IN_PROGRESS', '진행중', 'In Progress', '결재 진행 중',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000042', 'c0000001-0000-0000-0000-000000000007', NULL, NULL, 1,
     'APPROVED', '승인', 'Approved', '최종 승인 완료',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000043', 'c0000001-0000-0000-0000-000000000007', NULL, NULL, 1,
     'REJECTED', '반려', 'Rejected', '결재 반려',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000044', 'c0000001-0000-0000-0000-000000000007', NULL, NULL, 1,
     'RETURNED', '회수', 'Returned', '결재 회수',
     false, 'ACTIVE', true, 6,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000045', 'c0000001-0000-0000-0000-000000000007', NULL, NULL, 1,
     'CANCELLED', '취소', 'Cancelled', '신청자 취소',
     false, 'ACTIVE', true, 7,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. 가족관계 (RELATION_TYPE) - 8건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000046', 'c0000001-0000-0000-0000-000000000008', NULL, NULL, 1,
     'SPOUSE', '배우자', 'Spouse', '배우자',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000047', 'c0000001-0000-0000-0000-000000000008', NULL, NULL, 1,
     'FATHER', '부', 'Father', '부친',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000048', 'c0000001-0000-0000-0000-000000000008', NULL, NULL, 1,
     'MOTHER', '모', 'Mother', '모친',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000049', 'c0000001-0000-0000-0000-000000000008', NULL, NULL, 1,
     'SON', '아들', 'Son', '아들',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000050', 'c0000001-0000-0000-0000-000000000008', NULL, NULL, 1,
     'DAUGHTER', '딸', 'Daughter', '딸',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000051', 'c0000001-0000-0000-0000-000000000008', NULL, NULL, 1,
     'BROTHER', '형제', 'Brother', '형제',
     false, 'ACTIVE', true, 6,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000052', 'c0000001-0000-0000-0000-000000000008', NULL, NULL, 1,
     'SISTER', '자매', 'Sister', '자매',
     false, 'ACTIVE', true, 7,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000053', 'c0000001-0000-0000-0000-000000000008', NULL, NULL, 1,
     'OTHER_FAMILY', '기타가족', 'Other Family', '기타 가족 관계',
     false, 'ACTIVE', true, 8,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. 학위유형 (DEGREE_TYPE) - 6건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000054', 'c0000001-0000-0000-0000-000000000009', NULL, NULL, 1,
     'HIGH_SCHOOL', '고졸', 'High School', '고등학교 졸업',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000055', 'c0000001-0000-0000-0000-000000000009', NULL, NULL, 1,
     'ASSOCIATE', '전문학사', 'Associate', '전문대학 졸업',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000056', 'c0000001-0000-0000-0000-000000000009', NULL, NULL, 1,
     'BACHELOR', '학사', 'Bachelor', '4년제 대학 졸업',
     true, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000057', 'c0000001-0000-0000-0000-000000000009', NULL, NULL, 1,
     'MASTER', '석사', 'Master', '석사 학위 취득',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000058', 'c0000001-0000-0000-0000-000000000009', NULL, NULL, 1,
     'DOCTORATE', '박사', 'Doctorate', '박사 학위 취득',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000059', 'c0000001-0000-0000-0000-000000000009', NULL, NULL, 1,
     'OTHER', '기타', 'Other', '기타 학력',
     false, 'ACTIVE', true, 6,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 10. 알림유형 (NOTIFICATION_TYPE) - 8건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000060', 'c0000001-0000-0000-0000-000000000010', NULL, NULL, 1,
     'APPROVAL', '결재', 'Approval', '결재 요청/완료 알림',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000061', 'c0000001-0000-0000-0000-000000000010', NULL, NULL, 1,
     'SCHEDULE', '일정', 'Schedule', '일정 관련 알림',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000062', 'c0000001-0000-0000-0000-000000000010', NULL, NULL, 1,
     'ANNOUNCEMENT', '공지', 'Announcement', '공지사항 알림',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000063', 'c0000001-0000-0000-0000-000000000010', NULL, NULL, 1,
     'ATTENDANCE', '근태', 'Attendance', '근태 관련 알림',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000064', 'c0000001-0000-0000-0000-000000000010', NULL, NULL, 1,
     'LEAVE', '휴가', 'Leave', '휴가 관련 알림',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000065', 'c0000001-0000-0000-0000-000000000010', NULL, NULL, 1,
     'HR', '인사', 'HR', '인사 관련 알림',
     false, 'ACTIVE', true, 6,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000066', 'c0000001-0000-0000-0000-000000000010', NULL, NULL, 1,
     'SYSTEM', '시스템', 'System', '시스템 공지 알림',
     false, 'ACTIVE', true, 7,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000067', 'c0000001-0000-0000-0000-000000000010', NULL, NULL, 1,
     'GENERAL', '일반', 'General', '일반 알림',
     false, 'ACTIVE', true, 8,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 11. 휴일유형 (HOLIDAY_TYPE) - 4건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000068', 'c0000001-0000-0000-0000-000000000011', NULL, NULL, 1,
     'NATIONAL', '국경일', 'National Holiday', '법정 국경일',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000069', 'c0000001-0000-0000-0000-000000000011', NULL, NULL, 1,
     'PUBLIC', '공휴일', 'Public Holiday', '법정 공휴일',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000070', 'c0000001-0000-0000-0000-000000000011', NULL, NULL, 1,
     'ALTERNATIVE', '대체공휴일', 'Alternative Holiday', '대체 공휴일',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000071', 'c0000001-0000-0000-0000-000000000011', NULL, NULL, 1,
     'COMPANY', '창립기념일', 'Company Anniversary', '회사 창립 기념일',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 12. 성별 (GENDER) - 3건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000072', 'c0000001-0000-0000-0000-000000000012', NULL, NULL, 1,
     'MALE', '남성', 'Male', '남성',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000073', 'c0000001-0000-0000-0000-000000000012', NULL, NULL, 1,
     'FEMALE', '여성', 'Female', '여성',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000074', 'c0000001-0000-0000-0000-000000000012', NULL, NULL, 1,
     'OTHER', '기타', 'Other', '기타',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 13. 병역구분 (MILITARY_STATUS) - 5건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000075', 'c0000001-0000-0000-0000-000000000013', NULL, NULL, 1,
     'COMPLETED', '군필', 'Completed', '병역 이행 완료',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000076', 'c0000001-0000-0000-0000-000000000013', NULL, NULL, 1,
     'NOT_SERVED', '미필', 'Not Served', '병역 미이행',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000077', 'c0000001-0000-0000-0000-000000000013', NULL, NULL, 1,
     'EXEMPTED', '면제', 'Exempted', '병역 면제',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000078', 'c0000001-0000-0000-0000-000000000013', NULL, NULL, 1,
     'NOT_APPLICABLE', '해당없음', 'Not Applicable', '해당 없음 (여성 등)',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000079', 'c0000001-0000-0000-0000-000000000013', NULL, NULL, 1,
     'IN_SERVICE', '복무중', 'In Service', '현재 복무 중',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 14. 업종분류 (INDUSTRY_TYPE) - 8건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000080', 'c0000001-0000-0000-0000-000000000014', NULL, NULL, 1,
     'MANUFACTURING', '제조업', 'Manufacturing', '제조업',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000081', 'c0000001-0000-0000-0000-000000000014', NULL, NULL, 1,
     'IT', 'IT/통신', 'IT/Telecom', 'IT 및 통신 산업',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000082', 'c0000001-0000-0000-0000-000000000014', NULL, NULL, 1,
     'FINANCE', '금융/보험', 'Finance/Insurance', '금융 및 보험 산업',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000083', 'c0000001-0000-0000-0000-000000000014', NULL, NULL, 1,
     'CONSTRUCTION', '건설', 'Construction', '건설업',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000084', 'c0000001-0000-0000-0000-000000000014', NULL, NULL, 1,
     'BIO', '바이오/제약', 'Bio/Pharma', '바이오 및 제약 산업',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000085', 'c0000001-0000-0000-0000-000000000014', NULL, NULL, 1,
     'CHEMICAL', '화학/소재', 'Chemical/Materials', '화학 및 소재 산업',
     false, 'ACTIVE', true, 6,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000086', 'c0000001-0000-0000-0000-000000000014', NULL, NULL, 1,
     'ENERGY', '에너지', 'Energy', '에너지 산업',
     false, 'ACTIVE', true, 7,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000087', 'c0000001-0000-0000-0000-000000000014', NULL, NULL, 1,
     'SERVICE', '서비스업', 'Service', '서비스업',
     false, 'ACTIVE', true, 8,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 15. 초과근무유형 (OVERTIME_TYPE) - 3건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000088', 'c0000001-0000-0000-0000-000000000015', NULL, NULL, 1,
     'EXTENDED', '연장근무', 'Extended Work', '평일 야간 연장 근무',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000089', 'c0000001-0000-0000-0000-000000000015', NULL, NULL, 1,
     'HOLIDAY', '휴일근무', 'Holiday Work', '휴일 근무',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000090', 'c0000001-0000-0000-0000-000000000015', NULL, NULL, 1,
     'NIGHT', '야간근무', 'Night Work', '22시 이후 야간 근무',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 16. 경조사유형 (CONDOLENCE_TYPE) - 6건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000091', 'c0000001-0000-0000-0000-000000000016', NULL, NULL, 1,
     'MARRIAGE', '본인결혼', 'Own Wedding', '본인 결혼',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000092', 'c0000001-0000-0000-0000-000000000016', NULL, NULL, 1,
     'CHILD_MARRIAGE', '자녀결혼', 'Child Wedding', '자녀 결혼',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000093', 'c0000001-0000-0000-0000-000000000016', NULL, NULL, 1,
     'CHILDBIRTH', '출산', 'Childbirth', '배우자 출산',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000094', 'c0000001-0000-0000-0000-000000000016', NULL, NULL, 1,
     'PARENT_DEATH', '부모상', 'Parent Death', '부모 사망',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000095', 'c0000001-0000-0000-0000-000000000016', NULL, NULL, 1,
     'GRANDPARENT_DEATH', '조부모상', 'Grandparent Death', '조부모 사망',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000096', 'c0000001-0000-0000-0000-000000000016', NULL, NULL, 1,
     'SIBLING_DEATH', '형제자매상', 'Sibling Death', '형제자매 사망',
     false, 'ACTIVE', true, 6,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 17. 출장유형 (BUSINESS_TRIP_TYPE) - 3건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000097', 'c0000001-0000-0000-0000-000000000017', NULL, NULL, 1,
     'DOMESTIC', '국내출장', 'Domestic', '국내 출장',
     true, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000098', 'c0000001-0000-0000-0000-000000000017', NULL, NULL, 1,
     'DOMESTIC_LONG', '국내장기출장', 'Domestic Long-term', '국내 장기 출장',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000099', 'c0000001-0000-0000-0000-000000000017', NULL, NULL, 1,
     'OVERSEAS', '해외출장', 'Overseas', '해외 출장',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 18. 은행코드 (BANK_CODE) - 15건
-- extra_value1: 은행 기관코드
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description, extra_value1,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000100', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'KB', '국민은행', 'KB Kookmin Bank', 'KB국민은행', '004',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000101', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'SHINHAN', '신한은행', 'Shinhan Bank', '신한은행', '088',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000102', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'WOORI', '우리은행', 'Woori Bank', '우리은행', '020',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000103', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'HANA', '하나은행', 'Hana Bank', '하나은행', '081',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000104', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'NH', '농협은행', 'NH Nonghyup Bank', 'NH농협은행', '011',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000105', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'IBK', '기업은행', 'IBK Industrial Bank', 'IBK기업은행', '003',
     false, 'ACTIVE', true, 6,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000106', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'SC', 'SC제일은행', 'SC First Bank', 'SC제일은행', '023',
     false, 'ACTIVE', true, 7,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000107', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'CITI', '한국씨티은행', 'Citibank Korea', '한국씨티은행', '027',
     false, 'ACTIVE', true, 8,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000108', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'KBANK', '케이뱅크', 'K Bank', '케이뱅크', '089',
     false, 'ACTIVE', true, 9,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000109', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'KAKAO', '카카오뱅크', 'Kakao Bank', '카카오뱅크', '090',
     false, 'ACTIVE', true, 10,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000110', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'TOSS', '토스뱅크', 'Toss Bank', '토스뱅크', '092',
     false, 'ACTIVE', true, 11,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000111', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'DAEGU', '대구은행', 'Daegu Bank', '대구은행', '031',
     false, 'ACTIVE', true, 12,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000112', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'BUSAN', '부산은행', 'Busan Bank', '부산은행', '032',
     false, 'ACTIVE', true, 13,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000113', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'KWANGJU', '광주은행', 'Kwangju Bank', '광주은행', '034',
     false, 'ACTIVE', true, 14,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000114', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'JEONBUK', '전북은행', 'Jeonbuk Bank', '전북은행', '037',
     false, 'ACTIVE', true, 15,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 19. 지역코드 (REGION_CODE) - 17건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000115', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'SEOUL', '서울', 'Seoul', '서울특별시',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000116', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'BUSAN', '부산', 'Busan', '부산광역시',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000117', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'DAEGU', '대구', 'Daegu', '대구광역시',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000118', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'INCHEON', '인천', 'Incheon', '인천광역시',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000119', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'GWANGJU', '광주', 'Gwangju', '광주광역시',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000120', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'DAEJEON', '대전', 'Daejeon', '대전광역시',
     false, 'ACTIVE', true, 6,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000121', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'ULSAN', '울산', 'Ulsan', '울산광역시',
     false, 'ACTIVE', true, 7,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000122', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'SEJONG', '세종', 'Sejong', '세종특별자치시',
     false, 'ACTIVE', true, 8,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000123', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'GYEONGGI', '경기', 'Gyeonggi', '경기도',
     false, 'ACTIVE', true, 9,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000124', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'GANGWON', '강원', 'Gangwon', '강원특별자치도',
     false, 'ACTIVE', true, 10,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000125', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'CHUNGBUK', '충북', 'Chungbuk', '충청북도',
     false, 'ACTIVE', true, 11,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000126', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'CHUNGNAM', '충남', 'Chungnam', '충청남도',
     false, 'ACTIVE', true, 12,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000127', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'JEONBUK', '전북', 'Jeonbuk', '전북특별자치도',
     false, 'ACTIVE', true, 13,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000128', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'JEONNAM', '전남', 'Jeonnam', '전라남도',
     false, 'ACTIVE', true, 14,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000129', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'GYEONGBUK', '경북', 'Gyeongbuk', '경상북도',
     false, 'ACTIVE', true, 15,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000130', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'GYEONGNAM', '경남', 'Gyeongnam', '경상남도',
     false, 'ACTIVE', true, 16,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000131', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'JEJU', '제주', 'Jeju', '제주특별자치도',
     false, 'ACTIVE', true, 17,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 20. 근무지유형 (WORK_LOCATION_TYPE) - 4건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000132', 'c0000001-0000-0000-0000-000000000020', NULL, NULL, 1,
     'OFFICE', '사무실', 'Office', '회사 사무실 근무',
     true, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000133', 'c0000001-0000-0000-0000-000000000020', NULL, NULL, 1,
     'REMOTE', '재택', 'Remote', '재택 근무',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000134', 'c0000001-0000-0000-0000-000000000020', NULL, NULL, 1,
     'FIELD', '현장', 'Field', '현장 근무',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000135', 'c0000001-0000-0000-0000-000000000020', NULL, NULL, 1,
     'OTHER', '기타', 'Other', '기타 근무지',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;


-- ============================================================================
-- PART 3: 테넌트별 코드 매핑 (한성전자: a0000001-0000-0000-0000-000000000002)
-- ============================================================================

-- 1. EMPLOYMENT_TYPE > FULL_TIME 커스텀 이름
INSERT INTO tenant_common.code_tenant_mapping (
    id, tenant_id, common_code_id,
    custom_code_name, custom_code_name_en, custom_description,
    is_hidden, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    gen_random_uuid(),
    'a0000001-0000-0000-0000-000000000002',
    'cc000001-0000-0000-0000-000000000001',
    '정규직(무기계약)', 'Full-time (Permanent)', '무기계약 정규직',
    false, true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 2. LEAVE_TYPE > REFRESH 커스텀 이름
INSERT INTO tenant_common.code_tenant_mapping (
    id, tenant_id, common_code_id,
    custom_code_name, custom_code_name_en, custom_description,
    is_hidden, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    gen_random_uuid(),
    'a0000001-0000-0000-0000-000000000002',
    'cc000001-0000-0000-0000-000000000022',
    '리프레시 휴가(5년차)', 'Refresh Leave (5yr)', '5년차 이상 리프레시 휴가',
    false, true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 3. OVERTIME_TYPE > EXTENDED 커스텀 이름
INSERT INTO tenant_common.code_tenant_mapping (
    id, tenant_id, common_code_id,
    custom_code_name, custom_code_name_en, custom_description,
    is_hidden, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    gen_random_uuid(),
    'a0000001-0000-0000-0000-000000000002',
    'cc000001-0000-0000-0000-000000000088',
    '시간외 근무', 'After-hours Work', '시간외 근무 (연장근무)',
    false, true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- 검증
-- ============================================================================
DO $$
DECLARE
    v_group_count INT;
    v_code_count INT;
    v_mapping_count INT;
BEGIN
    SELECT COUNT(*) INTO v_group_count FROM tenant_common.code_group;
    SELECT COUNT(*) INTO v_code_count FROM tenant_common.common_code;
    SELECT COUNT(*) INTO v_mapping_count FROM tenant_common.code_tenant_mapping;
    RAISE NOTICE '코드그룹 총 건수: %', v_group_count;
    RAISE NOTICE '공통코드 총 건수: %', v_code_count;
    RAISE NOTICE '테넌트매핑 총 건수: %', v_mapping_count;
END $$;
