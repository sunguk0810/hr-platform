-- ============================================================================
-- 99_run_all.sql
-- HR SaaS 플랫폼 샘플 데이터 전체 실행 스크립트 (v2.0)
-- ============================================================================
-- 사용법:
--   cd scripts/sample-data
--   psql -h localhost -p 15432 -U hr_saas -d hr_saas -f 99_run_all.sql
--
-- 데이터 규모: 570명, 8개 테넌트
-- 예상 실행 시간: 약 3-5분
-- ============================================================================

\timing on
\echo '============================================'
\echo 'HR SaaS 샘플 데이터 생성 시작 (v2.0)'
\echo '============================================'
\echo ''

-- ============================================================================
-- 0. 기존 데이터 초기화
-- ============================================================================
\echo '[0/12] 기존 샘플 데이터 초기화...'
\i 00_reset_sample_data.sql
\echo ''

-- ============================================================================
-- 1. 테넌트 생성 (8개 계열사 + 정책 + 기능)
-- ============================================================================
\echo '[1/12] 테넌트 생성 (8개 계열사, 40 정책, 160 기능)...'
\i 01_tenants.sql
\echo ''

-- ============================================================================
-- 2. MDM 코드 체계 (코드그룹, 공통코드, 테넌트 매핑)
-- ============================================================================
\echo '[2/12] MDM 코드 체계 생성 (~20그룹, ~200코드)...'
\i 02_mdm_codes.sql
\echo ''

-- ============================================================================
-- 3. 메뉴 & 권한 (메뉴 트리, 권한, 테넌트 설정)
-- ============================================================================
\echo '[3/12] 메뉴 & 권한 생성 (~70메뉴, ~200권한)...'
\i 03_mdm_menus.sql
\echo ''

-- ============================================================================
-- 4. 조직 구조 (직급, 직책, 부서)
-- ============================================================================
\echo '[4/12] 조직 구조 생성 (88직급, 72직책, ~120부서)...'
\i 04_organization.sql
\echo ''

-- ============================================================================
-- 5. 직원 마스터 & 상세 (570명 + 가족, 학력, 경력, 자격증 등)
-- ============================================================================
\echo '[5/12] 직원 마스터 & 상세 생성 (570명)...'
\i 05_employees.sql
\echo ''

-- ============================================================================
-- 6. 인증 & 감사 (사용자 계정, 로그인이력, 감사로그)
-- ============================================================================
\echo '[6/12] 인증 & 감사 데이터 생성 (~40계정, ~500로그인이력)...'
\i 06_auth.sql
\echo ''

-- ============================================================================
-- 7. 근태 & 휴가 (공휴일, 근태기록, 휴가잔액/신청, 초과근무)
-- ============================================================================
\echo '[7/12] 근태 & 휴가 데이터 생성 (~30,000근태, ~300휴가)...'
\i 07_attendance.sql
\echo ''

-- ============================================================================
-- 8. 전자결재 (결재양식, 결재문서, 결재선, 위임규칙)
-- ============================================================================
\echo '[8/12] 전자결재 데이터 생성 (64양식, ~250문서)...'
\i 08_approvals.sql
\echo ''

-- ============================================================================
-- 9. 조직 부가 데이터 (공지, 위원회, 정원, 경조사, 전출입, 사원증)
-- ============================================================================
\echo '[9/12] 조직 부가 데이터 생성 (공지, 위원회, 경조사 등)...'
\i 09_org_extras.sql
\echo ''

-- ============================================================================
-- 10. 채용 (공고, 지원자, 면접, 오퍼)
-- ============================================================================
\echo '[10/12] 채용 데이터 생성 (~15공고, ~40지원자)...'
\i 10_recruitment.sql
\echo ''

-- ============================================================================
-- 11. 발령 & 증명서 (발령안, 증명서 템플릿/유형/신청/발급)
-- ============================================================================
\echo '[11/12] 발령 & 증명서 데이터 생성...'
\i 11_appointments_certificates.sql
\echo ''

-- ============================================================================
-- 12. 알림 & 파일 (알림템플릿, 알림, 파일메타데이터)
-- ============================================================================
\echo '[12/12] 알림 & 파일 데이터 생성 (128템플릿, ~200알림)...'
\i 12_notifications_files.sql
\echo ''

-- ============================================================================
-- 최종 검증
-- ============================================================================
\echo '============================================'
\echo '최종 데이터 검증'
\echo '============================================'

SELECT '테넌트' as "테이블", COUNT(*)::TEXT as "건수" FROM tenant_common.tenant
UNION ALL
SELECT '테넌트정책', COUNT(*)::TEXT FROM tenant_common.tenant_policy
UNION ALL
SELECT '테넌트기능', COUNT(*)::TEXT FROM tenant_common.tenant_feature
UNION ALL
SELECT '코드그룹', COUNT(*)::TEXT FROM tenant_common.code_group
UNION ALL
SELECT '공통코드', COUNT(*)::TEXT FROM tenant_common.common_code
UNION ALL
SELECT '메뉴항목', COUNT(*)::TEXT FROM tenant_common.menu_item
UNION ALL
SELECT '메뉴권한', COUNT(*)::TEXT FROM tenant_common.menu_permission
UNION ALL
SELECT '직급', COUNT(*)::TEXT FROM hr_core.grade
UNION ALL
SELECT '직책', COUNT(*)::TEXT FROM hr_core.position
UNION ALL
SELECT '부서', COUNT(*)::TEXT FROM hr_core.department
UNION ALL
SELECT '직원', COUNT(*)::TEXT FROM hr_core.employee
UNION ALL
SELECT '사용자계정', COUNT(*)::TEXT FROM tenant_common.users
UNION ALL
SELECT '감사로그', COUNT(*)::TEXT FROM tenant_common.audit_log
UNION ALL
SELECT '공휴일', COUNT(*)::TEXT FROM hr_attendance.holiday
UNION ALL
SELECT '근태기록', COUNT(*)::TEXT FROM hr_attendance.attendance_record
UNION ALL
SELECT '휴가잔액', COUNT(*)::TEXT FROM hr_attendance.leave_balance
UNION ALL
SELECT '휴가신청', COUNT(*)::TEXT FROM hr_attendance.leave_request
UNION ALL
SELECT '초과근무', COUNT(*)::TEXT FROM hr_attendance.overtime_request
UNION ALL
SELECT '결재양식', COUNT(*)::TEXT FROM hr_approval.approval_template
UNION ALL
SELECT '결재문서', COUNT(*)::TEXT FROM hr_approval.approval_document
UNION ALL
SELECT '결재선', COUNT(*)::TEXT FROM hr_approval.approval_line
UNION ALL
SELECT '공지사항', COUNT(*)::TEXT FROM hr_core.announcement
UNION ALL
SELECT '위원회', COUNT(*)::TEXT FROM hr_core.committee
UNION ALL
SELECT '채용공고', COUNT(*)::TEXT FROM hr_recruitment.job_posting
UNION ALL
SELECT '지원자', COUNT(*)::TEXT FROM hr_recruitment.applicant
UNION ALL
SELECT '면접', COUNT(*)::TEXT FROM hr_recruitment.interview
UNION ALL
SELECT '발령안', COUNT(*)::TEXT FROM hr_appointment.appointment_draft
UNION ALL
SELECT '증명서템플릿', COUNT(*)::TEXT FROM hr_certificate.certificate_template
UNION ALL
SELECT '증명서유형', COUNT(*)::TEXT FROM hr_certificate.certificate_type
UNION ALL
SELECT '증명서신청', COUNT(*)::TEXT FROM hr_certificate.certificate_request
UNION ALL
SELECT '알림템플릿', COUNT(*)::TEXT FROM hr_notification.notification_template
UNION ALL
SELECT '알림', COUNT(*)::TEXT FROM hr_notification.notification
UNION ALL
SELECT '파일', COUNT(*)::TEXT FROM hr_file.file_metadata;

\echo ''
\echo '============================================'
\echo '테넌트별 직원 현황'
\echo '============================================'

SELECT
    t.name as "계열사",
    COUNT(e.id) as "직원수",
    (SELECT COUNT(*) FROM hr_core.department WHERE tenant_id = t.id) as "부서수"
FROM tenant_common.tenant t
LEFT JOIN hr_core.employee e ON t.id = e.tenant_id
GROUP BY t.id, t.name
ORDER BY COUNT(e.id) DESC;

\echo ''
\echo '============================================'
\echo '테스트 계정별 데이터 확인'
\echo '============================================'

SELECT
    u.username as "계정",
    u.roles::TEXT as "역할",
    (SELECT COUNT(*) FROM hr_attendance.attendance_record ar WHERE ar.employee_id = u.employee_id) as "근태",
    (SELECT COUNT(*) FROM hr_attendance.leave_balance lb WHERE lb.employee_id = u.employee_id) as "휴가잔액",
    (SELECT COUNT(*) FROM hr_approval.approval_document ad WHERE ad.drafter_id = u.employee_id) as "내결재",
    (SELECT COUNT(*) FROM hr_notification.notification n WHERE n.user_id = u.id) as "알림"
FROM tenant_common.users u
WHERE u.username IN ('superadmin','ceo.elec','hr.admin.elec','hr.manager.elec','dev.manager.elec','dev.senior.elec','dev.staff.elec')
ORDER BY u.username;

\echo ''
\echo '============================================'
\echo 'HR SaaS 샘플 데이터 생성 완료! (v2.0)'
\echo '============================================'
\echo ''
\echo '테스트 계정 (한성전자):'
\echo '  - 시스템관리자: superadmin / Admin@2025!'
\echo '  - CEO:         ceo.elec / Ceo@2025!'
\echo '  - HR관리자:    hr.admin.elec / HrAdmin@2025!'
\echo '  - HR담당자:    hr.manager.elec / HrMgr@2025!'
\echo '  - 부서장:      dev.manager.elec / DevMgr@2025!'
\echo '  - 선임:        dev.senior.elec / DevSr@2025!'
\echo '  - 일반사원:    dev.staff.elec / DevStaff@2025!'
\echo ''
\echo '데이터 규모: 570명 (8 테넌트), ~46,000 레코드'
\echo ''

\timing off
