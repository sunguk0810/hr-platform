-- ============================================================================
-- 21_auth_login_history_generator.sql
-- Auth 서비스 로그인 이력 샘플 데이터 생성
-- ============================================================================
-- 생성 규모:
--   - 로그인 이력: ~10,000건 (최근 30일)
--   - 계정 잠금: 일부 실패 계정 (테스트용)
--   - 세션/토큰: 런타임 데이터로 생성하지 않음
-- ============================================================================

-- RLS 비활성화
SET app.current_tenant = '00000000-0000-0000-0000-000000000000';

-- ============================================================================
-- 로그인 이력 생성
-- ============================================================================

DO $$
DECLARE
    v_tenant RECORD;
    v_employee RECORD;
    v_history_count INT := 0;
    v_login_types VARCHAR(20)[] := ARRAY['PASSWORD', 'SSO', 'MFA'];
    v_statuses VARCHAR(20)[] := ARRAY['SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS', 'FAILED']; -- 80% 성공
    v_failure_reasons VARCHAR(200)[] := ARRAY['잘못된 비밀번호', '계정 잠금', '유효하지 않은 MFA 코드', '세션 만료', '접근 권한 없음'];
    v_login_type VARCHAR(20);
    v_status VARCHAR(20);
    v_login_time TIMESTAMP WITH TIME ZONE;
    v_ip_prefix VARCHAR(20);
    v_employees_per_tenant INT;
BEGIN
    RAISE NOTICE '로그인 이력 생성 중...';

    FOR v_tenant IN SELECT id, code, name FROM tenant_common.tenant LOOP
        -- 테넌트별 IP 대역 설정
        v_ip_prefix := CASE v_tenant.code
            WHEN 'HANSUNG_HD' THEN '10.1.'
            WHEN 'HANSUNG_ELEC' THEN '10.2.'
            WHEN 'HANSUNG_SDI' THEN '10.3.'
            WHEN 'HANSUNG_ENG' THEN '10.4.'
            WHEN 'HANSUNG_BIO' THEN '10.5.'
            WHEN 'HANSUNG_CHEM' THEN '10.6.'
            WHEN 'HANSUNG_IT' THEN '10.7.'
            WHEN 'HANSUNG_LIFE' THEN '10.8.'
            ELSE '192.168.'
        END;

        -- 테넌트 규모에 따른 로그인 이력 수
        v_employees_per_tenant := CASE
            WHEN v_tenant.code = 'HANSUNG_ELEC' THEN 3000
            WHEN v_tenant.code IN ('HANSUNG_LIFE', 'HANSUNG_SDI') THEN 1500
            ELSE 1000
        END;

        -- 랜덤 직원들의 로그인 이력 생성
        FOR v_employee IN
            SELECT e.id, e.employee_number, e.email
            FROM hr_core.employee e
            WHERE e.tenant_id = v_tenant.id AND e.status = 'ACTIVE'
            ORDER BY RANDOM()
            LIMIT v_employees_per_tenant / 10  -- 직원의 10%만 선택
        LOOP
            -- 각 직원당 3~15회 로그인
            FOR i IN 1..(3 + FLOOR(RANDOM() * 13)::INT) LOOP
                v_login_type := v_login_types[1 + FLOOR(RANDOM() * 3)::INT];
                v_status := v_statuses[1 + FLOOR(RANDOM() * 5)::INT];
                v_login_time := CURRENT_TIMESTAMP - (FLOOR(RANDOM() * 30) || ' days')::INTERVAL
                              - (FLOOR(RANDOM() * 24) || ' hours')::INTERVAL
                              - (FLOOR(RANDOM() * 60) || ' minutes')::INTERVAL;

                INSERT INTO tenant_common.login_history (
                    user_id, tenant_id, login_type, status,
                    ip_address, user_agent, location, failure_reason, created_at
                ) VALUES (
                    v_employee.employee_number,
                    v_tenant.id,
                    v_login_type,
                    v_status,
                    v_ip_prefix || FLOOR(RANDOM() * 255)::INT || '.' || FLOOR(RANDOM() * 255)::INT,
                    CASE FLOOR(RANDOM() * 4)::INT
                        WHEN 0 THEN 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0'
                        WHEN 1 THEN 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Safari/605.1.15'
                        WHEN 2 THEN 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Mobile/15E148'
                        ELSE 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0'
                    END,
                    CASE FLOOR(RANDOM() * 5)::INT
                        WHEN 0 THEN '서울 강남구'
                        WHEN 1 THEN '서울 서초구'
                        WHEN 2 THEN '경기 수원시'
                        WHEN 3 THEN '경기 성남시'
                        ELSE '서울 영등포구'
                    END,
                    CASE WHEN v_status = 'FAILED' THEN v_failure_reasons[1 + FLOOR(RANDOM() * 5)::INT] ELSE NULL END,
                    v_login_time
                );

                v_history_count := v_history_count + 1;
            END LOOP;
        END LOOP;

        RAISE NOTICE '  테넌트 % 완료', v_tenant.name;
    END LOOP;

    RAISE NOTICE '로그인 이력 % 건 생성 완료', v_history_count;
END $$;

-- ============================================================================
-- 테스트 계정 로그인 이력 생성 (최근 활동 기록)
-- ============================================================================

DO $$
DECLARE
    v_tenant_id UUID;
    v_test_accounts TEXT[][] := ARRAY[
        ARRAY['superadmin', 'SYSTEM'],
        ARRAY['ceo.elec', 'HANSUNG_ELEC'],
        ARRAY['hr.admin.elec', 'HANSUNG_ELEC'],
        ARRAY['hr.manager.elec', 'HANSUNG_ELEC'],
        ARRAY['dev.manager.elec', 'HANSUNG_ELEC'],
        ARRAY['dev.staff.elec', 'HANSUNG_ELEC']
    ];
BEGIN
    RAISE NOTICE '테스트 계정 로그인 이력 생성 중...';

    FOR i IN 1..array_length(v_test_accounts, 1) LOOP
        -- 테넌트 ID 조회
        IF v_test_accounts[i][2] = 'SYSTEM' THEN
            v_tenant_id := NULL;
        ELSE
            SELECT id INTO v_tenant_id FROM tenant_common.tenant WHERE code = v_test_accounts[i][2];
        END IF;

        -- 최근 7일간 매일 로그인 기록
        FOR j IN 0..6 LOOP
            INSERT INTO tenant_common.login_history (
                user_id, tenant_id, login_type, status,
                ip_address, user_agent, location, created_at
            ) VALUES (
                v_test_accounts[i][1],
                v_tenant_id,
                CASE WHEN RANDOM() < 0.7 THEN 'PASSWORD' ELSE 'SSO' END,
                'SUCCESS',
                '10.0.0.' || (100 + i),
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0',
                '서울 강남구',
                CURRENT_TIMESTAMP - (j || ' days')::INTERVAL - (8 + FLOOR(RANDOM() * 2) || ' hours')::INTERVAL
            );

            -- 퇴근 전 재로그인
            IF RANDOM() < 0.5 THEN
                INSERT INTO tenant_common.login_history (
                    user_id, tenant_id, login_type, status,
                    ip_address, user_agent, location, created_at
                ) VALUES (
                    v_test_accounts[i][1],
                    v_tenant_id,
                    'PASSWORD',
                    'SUCCESS',
                    '10.0.0.' || (100 + i),
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0',
                    '서울 강남구',
                    CURRENT_TIMESTAMP - (j || ' days')::INTERVAL - (14 + FLOOR(RANDOM() * 4) || ' hours')::INTERVAL
                );
            END IF;
        END LOOP;
    END LOOP;

    RAISE NOTICE '테스트 계정 로그인 이력 생성 완료';
END $$;

-- ============================================================================
-- 검증
-- ============================================================================

DO $$
DECLARE
    v_session_count INT;
    v_token_count INT;
    v_history_count INT;
    v_lock_count INT;
BEGIN
    SELECT COUNT(*) INTO v_session_count FROM tenant_common.user_sessions;
    SELECT COUNT(*) INTO v_token_count FROM tenant_common.password_reset_tokens;
    SELECT COUNT(*) INTO v_history_count FROM tenant_common.login_history;
    SELECT COUNT(*) INTO v_lock_count FROM tenant_common.account_locks;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Auth 서비스 샘플 데이터 생성 완료';
    RAISE NOTICE '========================================';
    RAISE NOTICE '사용자 세션: % 건 (런타임 생성)', v_session_count;
    RAISE NOTICE '비밀번호 재설정 토큰: % 건 (런타임 생성)', v_token_count;
    RAISE NOTICE '로그인 이력: % 건', v_history_count;
    RAISE NOTICE '계정 잠금: % 건', v_lock_count;
    RAISE NOTICE '========================================';
END $$;
