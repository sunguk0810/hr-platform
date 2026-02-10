-- ============================================================================
-- 99_run_all.sql
-- HR SaaS 플랫폼 샘플 데이터 전체 실행 스크립트
-- ============================================================================
-- 사용법:
--   psql -h localhost -p 5433 -U hr_saas -d hr_saas -f scripts/sample-data/99_run_all.sql
--
-- 예상 실행 시간: 약 40-60분 (75,000명 규모)
-- ============================================================================

\timing on
\echo '============================================'
\echo 'HR SaaS 샘플 데이터 생성 시작'
\echo '============================================'
\echo ''

-- ============================================================================
-- 0. 기존 데이터 초기화 (선택적)
-- ============================================================================
\echo '[0/22] 기존 샘플 데이터 초기화...'
\i 00_reset_sample_data.sql
\echo ''

-- ============================================================================
-- 1. 테넌트 생성 (8개 계열사)
-- ============================================================================
\echo '[1/22] 테넌트 생성...'
\i 01_tenant_seed.sql
\echo ''

-- ============================================================================
-- 2. 테넌트 정책/기능 설정
-- ============================================================================
\echo '[2/22] 테넌트 정책/기능 설정...'
\i 02_tenant_policy_feature.sql
\echo ''

-- ============================================================================
-- 3. 공통코드 그룹 생성
-- ============================================================================
\echo '[3/22] 공통코드 그룹 생성...'
\i 03_mdm_code_groups.sql
\echo ''

-- ============================================================================
-- 4. 공통코드 상세 생성
-- ============================================================================
\echo '[4/22] 공통코드 상세 생성...'
\i 04_mdm_common_codes.sql
\echo ''

-- ============================================================================
-- 5. 직급/직책 마스터 생성
-- ============================================================================
\echo '[5/22] 직급/직책 마스터 생성...'
\i 05_organization_grades_positions.sql
\echo ''

-- ============================================================================
-- 6. 부서 구조 생성 (~500개)
-- ============================================================================
\echo '[6/22] 부서 구조 생성...'
\i 06_organization_departments.sql
\echo ''

-- ============================================================================
-- 7. 직원 생성 함수 준비
-- ============================================================================
\echo '[7/22] 직원 생성 함수 준비...'
\i 07_employee_generator.sql
\echo ''

-- ============================================================================
-- 8. 직원 대량 생성 (~75,000명) - 가장 오래 걸림
-- ============================================================================
\echo '[8/22] 직원 대량 생성 (약 5-10분 소요)...'
\i 08_employee_execute.sql
\echo ''

-- ============================================================================
-- 9. 직원 상세 정보 생성 (가족, 학력, 경력, 자격증)
-- ============================================================================
\echo '[9/22] 직원 상세 정보 생성 (약 5-10분 소요)...'
\i 09_employee_details_generator.sql
\echo ''

-- ============================================================================
-- 10. 공휴일 데이터 생성
-- ============================================================================
\echo '[10/22] 공휴일 데이터 생성...'
\i 10_attendance_holidays.sql
\echo ''

-- ============================================================================
-- 11. 휴가 잔액 생성
-- ============================================================================
\echo '[11/22] 휴가 잔액 생성 (약 3-5분 소요)...'
\i 11_leave_balance_generator.sql
\echo ''

-- ============================================================================
-- 12. 근태 기록 대량 생성 (~4,500,000건) - 가장 오래 걸림
-- ============================================================================
\echo '[12/22] 근태 기록 대량 생성 (약 15-25분 소요)...'
\i 12_attendance_generator.sql
\echo ''

-- ============================================================================
-- 13. 휴가/초과근무 신청 생성
-- ============================================================================
\echo '[13/22] 휴가/초과근무 신청 생성...'
\i 13_leave_overtime_generator.sql
\echo ''

-- ============================================================================
-- 14. 결재 양식 생성
-- ============================================================================
\echo '[14/22] 결재 양식 생성...'
\i 14_approval_templates.sql
\echo ''

-- ============================================================================
-- 15. 결재 문서 대량 생성 (~30,000건)
-- ============================================================================
\echo '[15/22] 결재 문서 대량 생성...'
\i 15_approval_generator.sql
\echo ''

-- ============================================================================
-- 16. 알림 데이터 생성 (템플릿, 설정, 알림)
-- ============================================================================
\echo '[16/22] 알림 데이터 생성...'
\i 16_notification_generator.sql
\echo ''

-- ============================================================================
-- 17. 파일 메타데이터 생성
-- ============================================================================
\echo '[17/22] 파일 메타데이터 생성...'
\i 17_file_generator.sql
\echo ''

-- ============================================================================
-- 18. 채용 데이터 생성 (공고, 지원자, 면접, 오퍼)
-- ============================================================================
\echo '[18/22] 채용 데이터 생성...'
\i 18_recruitment_generator.sql
\echo ''

-- ============================================================================
-- 19. 발령 데이터 생성 (발령안, 발령상세, 예약발령, 발령이력)
-- ============================================================================
\echo '[19/22] 발령 데이터 생성...'
\i 19_appointment_generator.sql
\echo ''

-- ============================================================================
-- 20. 증명서 데이터 생성 (템플릿, 유형, 신청, 발급, 진위확인)
-- ============================================================================
\echo '[20/22] 증명서 데이터 생성...'
\i 20_certificate_generator.sql
\echo ''

-- ============================================================================
-- 21. Auth 사용자 계정 생성
-- ============================================================================
\echo '[21/22] Auth 사용자 계정 생성...'
\i 22_auth_users_generator.sql
\echo ''

-- ============================================================================
-- 22. Auth 로그인 이력 생성
-- ============================================================================
\echo '[22/22] Auth 로그인 이력 생성...'
\i 21_auth_login_history_generator.sql
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
SELECT '직급', COUNT(*)::TEXT FROM hr_core.grade
UNION ALL
SELECT '직책', COUNT(*)::TEXT FROM hr_core.position
UNION ALL
SELECT '부서', COUNT(*)::TEXT FROM hr_core.department
UNION ALL
SELECT '직원', COUNT(*)::TEXT FROM hr_core.employee
UNION ALL
SELECT '직원가족', COUNT(*)::TEXT FROM hr_core.employee_family
UNION ALL
SELECT '직원학력', COUNT(*)::TEXT FROM hr_core.employee_education
UNION ALL
SELECT '직원경력', COUNT(*)::TEXT FROM hr_core.employee_career
UNION ALL
SELECT '직원자격증', COUNT(*)::TEXT FROM hr_core.employee_certificate
UNION ALL
SELECT '공휴일', COUNT(*)::TEXT FROM hr_attendance.holiday
UNION ALL
SELECT '휴가잔액', COUNT(*)::TEXT FROM hr_attendance.leave_balance
UNION ALL
SELECT '근태기록', COUNT(*)::TEXT FROM hr_attendance.attendance_record
UNION ALL
SELECT '휴가신청', COUNT(*)::TEXT FROM hr_attendance.leave_request
UNION ALL
SELECT '초과근무신청', COUNT(*)::TEXT FROM hr_attendance.overtime_request
UNION ALL
SELECT '결재양식', COUNT(*)::TEXT FROM hr_approval.approval_template
UNION ALL
SELECT '결재문서', COUNT(*)::TEXT FROM hr_approval.approval_document
UNION ALL
SELECT '결재선', COUNT(*)::TEXT FROM hr_approval.approval_line
UNION ALL
SELECT '결재이력', COUNT(*)::TEXT FROM hr_approval.approval_history
UNION ALL
SELECT '알림템플릿', COUNT(*)::TEXT FROM hr_notification.notification_template
UNION ALL
SELECT '알림설정', COUNT(*)::TEXT FROM hr_notification.notification_preference
UNION ALL
SELECT '알림', COUNT(*)::TEXT FROM hr_notification.notification
UNION ALL
SELECT '파일', COUNT(*)::TEXT FROM hr_file.file_metadata
UNION ALL
SELECT '채용공고', COUNT(*)::TEXT FROM hr_recruitment.job_posting
UNION ALL
SELECT '지원자', COUNT(*)::TEXT FROM hr_recruitment.applicant
UNION ALL
SELECT '지원서', COUNT(*)::TEXT FROM hr_recruitment.application
UNION ALL
SELECT '면접', COUNT(*)::TEXT FROM hr_recruitment.interview
UNION ALL
SELECT '면접평가', COUNT(*)::TEXT FROM hr_recruitment.interview_score
UNION ALL
SELECT '채용오퍼', COUNT(*)::TEXT FROM hr_recruitment.offer
UNION ALL
SELECT '발령안', COUNT(*)::TEXT FROM hr_appointment.appointment_draft
UNION ALL
SELECT '발령상세', COUNT(*)::TEXT FROM hr_appointment.appointment_detail
UNION ALL
SELECT '예약발령', COUNT(*)::TEXT FROM hr_appointment.appointment_schedule
UNION ALL
SELECT '발령이력', COUNT(*)::TEXT FROM hr_appointment.appointment_history
UNION ALL
SELECT '증명서템플릿', COUNT(*)::TEXT FROM hr_certificate.certificate_template
UNION ALL
SELECT '증명서유형', COUNT(*)::TEXT FROM hr_certificate.certificate_type
UNION ALL
SELECT '증명서신청', COUNT(*)::TEXT FROM hr_certificate.certificate_request
UNION ALL
SELECT '발급증명서', COUNT(*)::TEXT FROM hr_certificate.certificate_issue
UNION ALL
SELECT '진위확인로그', COUNT(*)::TEXT FROM hr_certificate.verification_log
UNION ALL
SELECT '사용자계정', COUNT(*)::TEXT FROM tenant_common.users
UNION ALL
SELECT '로그인이력', COUNT(*)::TEXT FROM tenant_common.login_history
UNION ALL
SELECT '계정잠금', COUNT(*)::TEXT FROM tenant_common.account_locks;

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
\echo 'HR SaaS 샘플 데이터 생성 완료!'
\echo '============================================'
\echo ''
\echo '테스트 계정:'
\echo '  - 시스템관리자: superadmin / Admin@2025!'
\echo '  - 테넌트관리자: ceo.elec / Ceo@2025!'
\echo '  - HR관리자: hr.admin.elec / HrAdmin@2025!'
\echo '  - HR담당자: hr.manager.elec / HrMgr@2025!'
\echo '  - 부서장: dev.manager.elec / DevMgr@2025!'
\echo '  - 일반직원: dev.staff.elec / DevStaff@2025!'
\echo ''
\echo '생성된 서비스:'
\echo '  - tenant-service: 테넌트, 정책, 기능'
\echo '  - mdm-service: 코드그룹, 공통코드'
\echo '  - organization-service: 부서, 직급, 직책'
\echo '  - employee-service: 직원, 가족, 학력, 경력, 자격증'
\echo '  - attendance-service: 공휴일, 휴가, 근태'
\echo '  - approval-service: 결재양식, 결재문서'
\echo '  - notification-service: 알림템플릿, 알림설정, 알림'
\echo '  - file-service: 파일메타데이터'
\echo '  - recruitment-service: 채용공고, 지원자, 면접, 오퍼'
\echo '  - appointment-service: 발령안, 발령상세, 예약발령, 발령이력'
\echo '  - certificate-service: 증명서템플릿, 유형, 신청, 발급, 진위확인'
\echo '  - auth-service: 사용자계정, 로그인이력 (세션/토큰은 런타임 생성)'
\echo '  - gateway-service: N/A (라우팅 전용, DB 없음)'
\echo ''

\timing off
