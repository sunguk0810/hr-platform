-- ============================================================================
-- 17_file_generator.sql
-- 파일 메타데이터 생성
-- ============================================================================

BEGIN;

-- ============================================================================
-- 파일 메타데이터 생성
-- 결재문서 첨부파일, 직원 사진, 프로필 등
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_approval RECORD;
    v_count INT := 0;
    v_content_types TEXT[] := ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png'];
    v_extensions TEXT[] := ARRAY['pdf', 'docx', 'xlsx', 'pptx', 'jpg', 'png'];
    v_file_idx INT;
    v_content_type TEXT;
    v_extension TEXT;
    v_stored_name VARCHAR(500);
    v_original_name VARCHAR(500);
BEGIN
    RAISE NOTICE '파일 메타데이터 생성 중...';

    -- 1. 직원 프로필 사진 (약 20%의 직원)
    RAISE NOTICE '  직원 프로필 사진 생성...';
    FOR v_emp IN
        SELECT id, tenant_id, name, employee_number
        FROM hr_core.employee
        WHERE status = 'ACTIVE'
        AND RANDOM() < 0.2
        ORDER BY tenant_id, id
    LOOP
        v_stored_name := 'profiles/' || v_emp.tenant_id || '/' || v_emp.id || '.jpg';
        v_original_name := v_emp.name || '_프로필.jpg';

        INSERT INTO hr_file.file_metadata (
            id, tenant_id, original_name, stored_name, content_type, file_size,
            storage_path, bucket_name, storage_type,
            reference_type, reference_id, uploader_id, uploader_name,
            is_public, download_count, checksum,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_emp.tenant_id,
            v_original_name,
            v_stored_name,
            'image/jpeg',
            (50000 + FLOOR(RANDOM() * 450000))::BIGINT,  -- 50KB ~ 500KB
            'hr-saas-files/profiles',
            'hr-saas-files',
            'S3',
            'EMPLOYEE_PROFILE',
            v_emp.id,
            v_emp.id,
            v_emp.name,
            false,
            0,
            md5(v_stored_name),
            NOW() - ((FLOOR(RANDOM() * 365))::INT || ' days')::INTERVAL,
            NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
        );

        v_count := v_count + 1;
    END LOOP;

    RAISE NOTICE '    프로필 사진: %개', v_count;

    -- 2. 결재 문서 첨부파일 (약 30%의 결재문서)
    RAISE NOTICE '  결재 첨부파일 생성...';
    FOR v_approval IN
        SELECT ad.id, ad.tenant_id, ad.document_number, ad.drafter_id, ad.drafter_name
        FROM hr_approval.approval_document ad
        WHERE RANDOM() < 0.3
        ORDER BY ad.tenant_id, ad.id
    LOOP
        -- 1-3개의 첨부파일
        FOR i IN 1..FLOOR(1 + RANDOM() * 3)::INT LOOP
            v_file_idx := 1 + FLOOR(RANDOM() * 6)::INT;
            v_content_type := v_content_types[v_file_idx];
            v_extension := v_extensions[v_file_idx];
            v_stored_name := 'approval/' || v_approval.tenant_id || '/' || v_approval.id || '_' || i || '.' || v_extension;
            v_original_name := CASE v_extension
                WHEN 'pdf' THEN '첨부문서_' || i || '.pdf'
                WHEN 'docx' THEN '보고서_' || i || '.docx'
                WHEN 'xlsx' THEN '데이터_' || i || '.xlsx'
                WHEN 'pptx' THEN '발표자료_' || i || '.pptx'
                WHEN 'jpg' THEN '증빙사진_' || i || '.jpg'
                ELSE '첨부파일_' || i || '.' || v_extension
            END;

            INSERT INTO hr_file.file_metadata (
                id, tenant_id, original_name, stored_name, content_type, file_size,
                storage_path, bucket_name, storage_type,
                reference_type, reference_id, uploader_id, uploader_name,
                is_public, download_count, checksum,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(),
                v_approval.tenant_id,
                v_original_name,
                v_stored_name,
                v_content_type,
                CASE v_extension
                    WHEN 'jpg' THEN (100000 + FLOOR(RANDOM() * 4900000))::BIGINT  -- 100KB ~ 5MB
                    WHEN 'png' THEN (200000 + FLOOR(RANDOM() * 4800000))::BIGINT
                    WHEN 'pdf' THEN (50000 + FLOOR(RANDOM() * 9950000))::BIGINT   -- 50KB ~ 10MB
                    WHEN 'pptx' THEN (500000 + FLOOR(RANDOM() * 19500000))::BIGINT -- 500KB ~ 20MB
                    ELSE (20000 + FLOOR(RANDOM() * 980000))::BIGINT  -- 20KB ~ 1MB
                END,
                'hr-saas-files/approval',
                'hr-saas-files',
                'S3',
                'APPROVAL_ATTACHMENT',
                v_approval.id,
                v_approval.drafter_id,
                v_approval.drafter_name,
                false,
                FLOOR(RANDOM() * 5)::INT,
                md5(v_stored_name),
                NOW() - ((FLOOR(RANDOM() * 90))::INT || ' days')::INTERVAL,
                NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
            );

            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    -- 3. 공지사항 첨부파일 (가상)
    RAISE NOTICE '  공지사항 첨부파일 생성...';
    FOR v_emp IN
        SELECT DISTINCT t.id as tenant_id,
               (SELECT id FROM hr_core.employee WHERE tenant_id = t.id ORDER BY RANDOM() LIMIT 1) as uploader_id,
               (SELECT name FROM hr_core.employee WHERE tenant_id = t.id ORDER BY RANDOM() LIMIT 1) as uploader_name
        FROM tenant_common.tenant t
    LOOP
        FOR i IN 1..10 LOOP  -- 테넌트당 10개의 공지사항 첨부파일
            v_stored_name := 'announcement/' || v_emp.tenant_id || '/notice_' || i || '.pdf';
            v_original_name := '공지사항_' || i || '.pdf';

            INSERT INTO hr_file.file_metadata (
                id, tenant_id, original_name, stored_name, content_type, file_size,
                storage_path, bucket_name, storage_type,
                reference_type, reference_id, uploader_id, uploader_name,
                is_public, download_count, checksum,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(),
                v_emp.tenant_id,
                v_original_name,
                v_stored_name,
                'application/pdf',
                (100000 + FLOOR(RANDOM() * 4900000))::BIGINT,
                'hr-saas-files/announcement',
                'hr-saas-files',
                'S3',
                'ANNOUNCEMENT',
                gen_random_uuid(),
                v_emp.uploader_id,
                v_emp.uploader_name,
                true,  -- 공지사항은 공개
                (10 + FLOOR(RANDOM() * 200))::INT,
                md5(v_stored_name),
                NOW() - ((FLOOR(RANDOM() * 180))::INT || ' days')::INTERVAL,
                NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
            );

            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '파일 메타데이터 생성 완료: %개', v_count;
END $$;

COMMIT;

-- 검증
DO $$
DECLARE
    v_count INT;
    v_record RECORD;
BEGIN
    SELECT COUNT(*) INTO v_count FROM hr_file.file_metadata;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '파일 메타데이터 생성 결과';
    RAISE NOTICE '========================================';
    RAISE NOTICE '총 파일 수: %개', v_count;
    RAISE NOTICE '';
    RAISE NOTICE '참조 유형별:';

    FOR v_record IN
        SELECT reference_type, COUNT(*) as cnt
        FROM hr_file.file_metadata
        GROUP BY reference_type
        ORDER BY cnt DESC
    LOOP
        RAISE NOTICE '  %-25s: %개', v_record.reference_type, v_record.cnt;
    END LOOP;
    RAISE NOTICE '========================================';
END $$;
