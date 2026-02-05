-- ============================================================================
-- 04_mdm_common_codes.sql
-- 공통코드 상세 데이터
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. 고용유형 (EMPLOYMENT_TYPE)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000001', NULL, 'REGULAR', '정규직', 'Regular', '기간의 정함이 없는 정규 고용', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000001', NULL, 'CONTRACT', '계약직', 'Contract', '기간의 정함이 있는 계약 고용', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000001', NULL, 'PART_TIME', '파트타임', 'Part-time', '단시간 근로자', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000001', NULL, 'INTERN', '인턴', 'Intern', '인턴십 고용', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000001', NULL, 'DISPATCH', '파견직', 'Dispatch', '파견 근로자', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000001', NULL, 'ADVISOR', '고문/자문', 'Advisor', '고문 또는 자문 계약', 6, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 2. 직원상태 (EMPLOYEE_STATUS)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000002', NULL, 'ACTIVE', '재직', 'Active', '현재 재직중', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000002', NULL, 'ON_LEAVE', '휴직', 'On Leave', '휴직 중', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000002', NULL, 'SUSPENDED', '정직', 'Suspended', '정직 처분', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000002', NULL, 'RESIGNED', '퇴직', 'Resigned', '퇴직 (자발적)', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000002', NULL, 'TERMINATED', '해고', 'Terminated', '퇴직 (비자발적)', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000002', NULL, 'RETIRED', '정년퇴직', 'Retired', '정년 퇴직', 6, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 3. 부서상태 (DEPARTMENT_STATUS)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000003', NULL, 'ACTIVE', '활성', 'Active', '정상 운영중인 부서', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000003', NULL, 'INACTIVE', '비활성', 'Inactive', '비활성화된 부서', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000003', NULL, 'MERGED', '통합', 'Merged', '다른 부서로 통합됨', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000003', NULL, 'DISSOLVED', '해체', 'Dissolved', '해체된 부서', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 4. 휴가유형 (LEAVE_TYPE)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, extra_value1, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000004', NULL, 'ANNUAL', '연차', 'Annual Leave', '연간 기본 휴가', 'DEDUCT', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000004', NULL, 'HALF_DAY', '반차', 'Half Day', '반일 휴가', 'DEDUCT', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000004', NULL, 'SICK', '병가', 'Sick Leave', '질병으로 인한 휴가', 'SEPARATE', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000004', NULL, 'MATERNITY', '출산휴가', 'Maternity Leave', '출산 전후 휴가', 'SPECIAL', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000004', NULL, 'PATERNITY', '배우자출산휴가', 'Paternity Leave', '배우자 출산 휴가', 'SPECIAL', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000004', NULL, 'PARENTAL', '육아휴직', 'Parental Leave', '육아를 위한 휴직', 'SPECIAL', 6, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000004', NULL, 'MARRIAGE', '결혼휴가', 'Marriage Leave', '본인 결혼 휴가', 'SPECIAL', 7, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000004', NULL, 'BEREAVEMENT', '경조휴가', 'Bereavement Leave', '가족 상 경조사 휴가', 'SPECIAL', 8, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000004', NULL, 'OFFICIAL', '공가', 'Official Leave', '공무 수행을 위한 휴가', 'SPECIAL', 9, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000004', NULL, 'SPECIAL', '특별휴가', 'Special Leave', '회사 부여 특별 휴가', 'SPECIAL', 10, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000004', NULL, 'UNPAID', '무급휴가', 'Unpaid Leave', '무급 휴가', 'UNPAID', 11, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000004', NULL, 'REFRESH', '리프레시휴가', 'Refresh Leave', '장기근속 리프레시 휴가', 'SPECIAL', 12, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 5. 근태상태 (ATTENDANCE_STATUS)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000005', NULL, 'NORMAL', '정상', 'Normal', '정상 출퇴근', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000005', NULL, 'LATE', '지각', 'Late', '출근 시간 지각', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000005', NULL, 'EARLY_LEAVE', '조퇴', 'Early Leave', '퇴근 시간 조퇴', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000005', NULL, 'ABSENT', '결근', 'Absent', '무단 결근', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000005', NULL, 'ON_LEAVE', '휴가', 'On Leave', '휴가 사용', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000005', NULL, 'BUSINESS_TRIP', '출장', 'Business Trip', '출장 중', 6, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000005', NULL, 'REMOTE_WORK', '재택근무', 'Remote Work', '재택/원격 근무', 7, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000005', NULL, 'TRAINING', '교육', 'Training', '교육/연수', 8, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000005', NULL, 'HOLIDAY', '휴일', 'Holiday', '공휴일/주말', 9, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 6. 결재문서유형 (APPROVAL_DOC_TYPE)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000006', NULL, 'LEAVE', '휴가신청', 'Leave Request', '휴가 신청 결재', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000006', NULL, 'OVERTIME', '초과근무신청', 'Overtime Request', '초과근무 신청 결재', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000006', NULL, 'BUSINESS_TRIP', '출장신청', 'Business Trip Request', '출장 신청 결재', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000006', NULL, 'EXPENSE', '경비청구', 'Expense Claim', '경비 청구 결재', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000006', NULL, 'PURCHASE', '구매요청', 'Purchase Request', '물품 구매 요청 결재', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000006', NULL, 'REPORT', '업무보고', 'Work Report', '업무 보고 결재', 6, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000006', NULL, 'GENERAL', '일반결재', 'General Approval', '일반 결재 문서', 7, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000006', NULL, 'HR_CHANGE', '인사변경', 'HR Change', '인사 관련 변경 결재', 8, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000006', NULL, 'TRANSFER', '인사이동', 'Transfer', '부서/직책 이동 결재', 9, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 7. 결재상태 (APPROVAL_STATUS)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000007', NULL, 'DRAFT', '임시저장', 'Draft', '작성 중 임시 저장', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000007', NULL, 'PENDING', '결재대기', 'Pending', '상신 후 결재 대기', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000007', NULL, 'IN_PROGRESS', '결재중', 'In Progress', '결재 진행 중', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000007', NULL, 'APPROVED', '승인', 'Approved', '최종 승인 완료', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000007', NULL, 'REJECTED', '반려', 'Rejected', '결재 반려', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000007', NULL, 'CANCELLED', '취소', 'Cancelled', '신청자 취소', 6, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000007', NULL, 'RETURNED', '회수', 'Returned', '결재 회수', 7, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 8. 가족관계 (RELATION_TYPE)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000008', NULL, 'SPOUSE', '배우자', 'Spouse', '배우자', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000008', NULL, 'CHILD', '자녀', 'Child', '자녀', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000008', NULL, 'FATHER', '부', 'Father', '부친', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000008', NULL, 'MOTHER', '모', 'Mother', '모친', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000008', NULL, 'SIBLING', '형제자매', 'Sibling', '형제 또는 자매', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000008', NULL, 'GRANDPARENT', '조부모', 'Grandparent', '조부모', 6, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000008', NULL, 'GRANDCHILD', '손자녀', 'Grandchild', '손자녀', 7, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000008', NULL, 'IN_LAW', '인척', 'In-law', '배우자 가족', 8, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 9. 학위유형 (DEGREE_TYPE)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000009', NULL, 'HIGH_SCHOOL', '고졸', 'High School', '고등학교 졸업', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000009', NULL, 'ASSOCIATE', '전문학사', 'Associate', '전문대학 졸업', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000009', NULL, 'BACHELOR', '학사', 'Bachelor', '4년제 대학 졸업', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000009', NULL, 'MASTER', '석사', 'Master', '석사 학위 취득', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000009', NULL, 'DOCTORATE', '박사', 'Doctorate', '박사 학위 취득', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000009', NULL, 'OTHER', '기타', 'Other', '기타 학력', 6, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 10. 알림유형 (NOTIFICATION_TYPE)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000010', NULL, 'APPROVAL', '결재알림', 'Approval', '결재 요청/완료 알림', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000010', NULL, 'LEAVE', '휴가알림', 'Leave', '휴가 관련 알림', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000010', NULL, 'ATTENDANCE', '근태알림', 'Attendance', '근태 관련 알림', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000010', NULL, 'ANNOUNCEMENT', '공지사항', 'Announcement', '공지사항 알림', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000010', NULL, 'SCHEDULE', '일정알림', 'Schedule', '일정 관련 알림', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000010', NULL, 'SYSTEM', '시스템알림', 'System', '시스템 공지 알림', 6, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000010', NULL, 'BIRTHDAY', '생일알림', 'Birthday', '직원 생일 알림', 7, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000010', NULL, 'ANNIVERSARY', '기념일알림', 'Anniversary', '입사 기념일 등 알림', 8, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 11. 휴일유형 (HOLIDAY_TYPE)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000011', NULL, 'NATIONAL', '국경일', 'National Holiday', '법정 국경일', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000011', NULL, 'PUBLIC', '공휴일', 'Public Holiday', '법정 공휴일', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000011', NULL, 'COMPANY', '창립기념일', 'Company Anniversary', '회사 창립 기념일', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000011', NULL, 'SPECIAL', '특별휴일', 'Special Holiday', '회사 지정 특별 휴일', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000011', NULL, 'SUBSTITUTE', '대체휴일', 'Substitute Holiday', '대체 공휴일', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 12. 성별 (GENDER)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000012', NULL, 'MALE', '남성', 'Male', '남성', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000012', NULL, 'FEMALE', '여성', 'Female', '여성', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 13. 병역구분 (MILITARY_STATUS)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000013', NULL, 'COMPLETED', '군필', 'Completed', '병역 이행 완료', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000013', NULL, 'NOT_COMPLETED', '미필', 'Not Completed', '병역 미이행', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000013', NULL, 'EXEMPTED', '면제', 'Exempted', '병역 면제', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000013', NULL, 'SERVING', '복무중', 'Serving', '현재 복무 중', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000013', NULL, 'NA', '해당없음', 'N/A', '해당 없음 (여성 등)', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 15. 초과근무유형 (OVERTIME_TYPE)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000015', NULL, 'EXTENDED', '연장근무', 'Extended Work', '평일 야간 연장 근무', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000015', NULL, 'HOLIDAY', '휴일근무', 'Holiday Work', '휴일 근무', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000015', NULL, 'NIGHT', '야간근무', 'Night Work', '22시 이후 야간 근무', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000015', NULL, 'WEEKEND', '주말근무', 'Weekend Work', '주말 근무', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 16. 경조사유형 (CONDOLENCE_TYPE)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, extra_value1, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000016', NULL, 'WEDDING_SELF', '본인결혼', 'Own Wedding', '본인 결혼', '5', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000016', NULL, 'WEDDING_CHILD', '자녀결혼', 'Child Wedding', '자녀 결혼', '1', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000016', NULL, 'BIRTH', '출산', 'Childbirth', '배우자 출산', '10', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000016', NULL, 'DEATH_PARENT', '부모상', 'Parent Death', '부모 사망', '5', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000016', NULL, 'DEATH_SPOUSE', '배우자상', 'Spouse Death', '배우자 사망', '5', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000016', NULL, 'DEATH_CHILD', '자녀상', 'Child Death', '자녀 사망', '5', 6, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000016', NULL, 'DEATH_GRANDPARENT', '조부모상', 'Grandparent Death', '조부모 사망', '3', 7, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000016', NULL, 'DEATH_SIBLING', '형제자매상', 'Sibling Death', '형제자매 사망', '3', 8, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000016', NULL, 'DEATH_IN_LAW', '배우자부모상', 'In-law Death', '배우자 부모 사망', '5', 9, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 17. 출장유형 (BUSINESS_TRIP_TYPE)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000017', NULL, 'DOMESTIC', '국내출장', 'Domestic', '국내 출장', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000017', NULL, 'OVERSEAS', '해외출장', 'Overseas', '해외 출장', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000017', NULL, 'LOCAL', '근거리출장', 'Local', '당일 근거리 출장', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000017', NULL, 'TRAINING', '교육출장', 'Training', '교육/연수 목적 출장', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 18. 은행코드 (BANK_CODE)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '004', 'KB국민은행', 'KB Kookmin Bank', 'KB국민은행', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '088', '신한은행', 'Shinhan Bank', '신한은행', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '020', '우리은행', 'Woori Bank', '우리은행', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '081', '하나은행', 'Hana Bank', '하나은행', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '003', 'IBK기업은행', 'IBK Industrial Bank', 'IBK기업은행', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '011', 'NH농협은행', 'NH Nonghyup Bank', 'NH농협은행', 6, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '023', 'SC제일은행', 'SC First Bank', 'SC제일은행', 7, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '027', '씨티은행', 'Citibank', '한국씨티은행', 8, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '039', '경남은행', 'Kyongnam Bank', '경남은행', 9, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '034', '광주은행', 'Kwangju Bank', '광주은행', 10, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '031', '대구은행', 'Daegu Bank', '대구은행', 11, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '032', '부산은행', 'Busan Bank', '부산은행', 12, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '090', '카카오뱅크', 'Kakao Bank', '카카오뱅크', 13, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '092', '토스뱅크', 'Toss Bank', '토스뱅크', 14, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '089', '케이뱅크', 'K Bank', '케이뱅크', 15, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 20. 근무지유형 (WORK_LOCATION_TYPE)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000020', NULL, 'OFFICE', '사무실', 'Office', '회사 사무실 근무', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000020', NULL, 'HOME', '재택', 'Home', '재택 근무', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000020', NULL, 'FIELD', '현장', 'Field', '현장 근무', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000020', NULL, 'SATELLITE', '거점오피스', 'Satellite Office', '위성 오피스 근무', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000020', NULL, 'CUSTOMER', '고객사', 'Customer Site', '고객사 상주 근무', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

COMMIT;

-- 검증
DO $$
DECLARE
    code_count INT;
BEGIN
    SELECT COUNT(*) INTO code_count FROM tenant_common.common_code;
    RAISE NOTICE '공통코드 생성 완료: % 개', code_count;
END $$;
