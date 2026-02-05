-- ============================================================================
-- 03_mdm_code_groups.sql
-- 공통코드 그룹 생성 (시스템 코드)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 시스템 공통코드 그룹 (is_system = true, tenant_id = null)
-- ============================================================================

-- 1. 고용 유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000001',
    NULL,
    'EMPLOYMENT_TYPE',
    '고용유형',
    'Employment Type',
    '정규직, 계약직 등 고용 형태 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 2. 직원 상태
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000002',
    NULL,
    'EMPLOYEE_STATUS',
    '직원상태',
    'Employee Status',
    '재직, 휴직, 퇴직 등 직원 상태 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 3. 부서 상태
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000003',
    NULL,
    'DEPARTMENT_STATUS',
    '부서상태',
    'Department Status',
    '활성, 비활성 등 부서 상태 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 4. 휴가 유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000004',
    NULL,
    'LEAVE_TYPE',
    '휴가유형',
    'Leave Type',
    '연차, 병가, 경조사 등 휴가 유형 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 5. 근태 상태
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000005',
    NULL,
    'ATTENDANCE_STATUS',
    '근태상태',
    'Attendance Status',
    '정상, 지각, 결근 등 근태 상태 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 6. 결재 문서 유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000006',
    NULL,
    'APPROVAL_DOC_TYPE',
    '결재문서유형',
    'Approval Document Type',
    '휴가신청, 경비청구 등 결재 문서 유형 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 7. 결재 상태
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000007',
    NULL,
    'APPROVAL_STATUS',
    '결재상태',
    'Approval Status',
    '대기, 진행중, 승인, 반려 등 결재 상태 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 8. 가족 관계
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000008',
    NULL,
    'RELATION_TYPE',
    '가족관계',
    'Family Relation Type',
    '배우자, 자녀, 부모 등 가족 관계 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 9. 학력 구분
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000009',
    NULL,
    'DEGREE_TYPE',
    '학위유형',
    'Degree Type',
    '고졸, 학사, 석사, 박사 등 학위 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 10. 알림 유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000010',
    NULL,
    'NOTIFICATION_TYPE',
    '알림유형',
    'Notification Type',
    '결재, 일정, 공지 등 알림 유형 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 11. 공휴일 유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000011',
    NULL,
    'HOLIDAY_TYPE',
    '휴일유형',
    'Holiday Type',
    '국경일, 공휴일, 창립기념일 등 휴일 유형 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 12. 성별
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000012',
    NULL,
    'GENDER',
    '성별',
    'Gender',
    '남성, 여성 등 성별 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 13. 병역 구분
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000013',
    NULL,
    'MILITARY_STATUS',
    '병역구분',
    'Military Status',
    '군필, 미필, 면제 등 병역 상태 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 14. 업종 분류
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000014',
    NULL,
    'INDUSTRY_TYPE',
    '업종분류',
    'Industry Type',
    '제조업, IT, 금융 등 업종 분류',
    true, true, 2, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 15. 초과근무 유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000015',
    NULL,
    'OVERTIME_TYPE',
    '초과근무유형',
    'Overtime Type',
    '연장근무, 휴일근무, 야간근무 등 초과근무 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 16. 경조사 유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000016',
    NULL,
    'CONDOLENCE_TYPE',
    '경조사유형',
    'Condolence Type',
    '결혼, 출산, 부고 등 경조사 유형 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 17. 출장 유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000017',
    NULL,
    'BUSINESS_TRIP_TYPE',
    '출장유형',
    'Business Trip Type',
    '국내출장, 해외출장 등 출장 유형 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 18. 은행 코드
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000018',
    NULL,
    'BANK_CODE',
    '은행코드',
    'Bank Code',
    '급여이체 등에 사용되는 은행 코드',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 19. 지역 코드
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000019',
    NULL,
    'REGION_CODE',
    '지역코드',
    'Region Code',
    '시도/시군구 등 지역 코드',
    true, true, 2, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 20. 근무지 유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000020',
    NULL,
    'WORK_LOCATION_TYPE',
    '근무지유형',
    'Work Location Type',
    '사무실, 재택, 현장 등 근무 장소 유형',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

COMMIT;

-- 검증
DO $$
DECLARE
    group_count INT;
BEGIN
    SELECT COUNT(*) INTO group_count FROM tenant_common.code_group;
    RAISE NOTICE '코드그룹 생성 완료: % 개', group_count;
END $$;
