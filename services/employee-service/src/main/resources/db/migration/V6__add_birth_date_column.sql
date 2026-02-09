-- 생일 컬럼 추가
ALTER TABLE hr_core.employee ADD COLUMN birth_date DATE;

-- 생일 조회를 위한 함수 인덱스 (월-일 기반)
CREATE INDEX idx_employees_birth_date_md
    ON hr_core.employee (EXTRACT(MONTH FROM birth_date), EXTRACT(DAY FROM birth_date))
    WHERE birth_date IS NOT NULL;
