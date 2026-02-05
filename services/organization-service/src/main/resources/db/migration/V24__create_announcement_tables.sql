-- Announcement table
CREATE TABLE IF NOT EXISTS hr_core.announcement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    category VARCHAR(20) NOT NULL DEFAULT 'NOTICE',
    author_id UUID NOT NULL,
    author_name VARCHAR(100),
    author_department VARCHAR(200),
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    view_count BIGINT NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Announcement attachment table
CREATE TABLE IF NOT EXISTS hr_core.announcement_attachment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES hr_core.announcement(id) ON DELETE CASCADE,
    file_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(1000),
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_announcement_tenant_id ON hr_core.announcement(tenant_id);
CREATE INDEX IF NOT EXISTS idx_announcement_category ON hr_core.announcement(category);
CREATE INDEX IF NOT EXISTS idx_announcement_is_published ON hr_core.announcement(is_published);
CREATE INDEX IF NOT EXISTS idx_announcement_is_pinned ON hr_core.announcement(is_pinned);
CREATE INDEX IF NOT EXISTS idx_announcement_published_at ON hr_core.announcement(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcement_created_at ON hr_core.announcement(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcement_attachment_announcement_id ON hr_core.announcement_attachment(announcement_id);

-- Enable RLS
ALTER TABLE hr_core.announcement ENABLE ROW LEVEL SECURITY;

-- RLS Policy for announcement
CREATE POLICY announcement_tenant_isolation ON hr_core.announcement
    USING (tenant_id::text = current_setting('app.current_tenant', true));

-- Comments
COMMENT ON TABLE hr_core.announcement IS '공지사항';
COMMENT ON COLUMN hr_core.announcement.title IS '제목';
COMMENT ON COLUMN hr_core.announcement.content IS '내용';
COMMENT ON COLUMN hr_core.announcement.category IS '카테고리 (NOTICE, EVENT, UPDATE, URGENT)';
COMMENT ON COLUMN hr_core.announcement.author_id IS '작성자 ID';
COMMENT ON COLUMN hr_core.announcement.author_name IS '작성자 이름';
COMMENT ON COLUMN hr_core.announcement.author_department IS '작성자 부서';
COMMENT ON COLUMN hr_core.announcement.is_pinned IS '상단 고정 여부';
COMMENT ON COLUMN hr_core.announcement.view_count IS '조회수';
COMMENT ON COLUMN hr_core.announcement.is_published IS '발행 여부';
COMMENT ON COLUMN hr_core.announcement.published_at IS '발행 일시';

COMMENT ON TABLE hr_core.announcement_attachment IS '공지사항 첨부파일';
COMMENT ON COLUMN hr_core.announcement_attachment.file_id IS '파일 서비스 파일 ID';
COMMENT ON COLUMN hr_core.announcement_attachment.file_name IS '파일명';
COMMENT ON COLUMN hr_core.announcement_attachment.file_url IS '파일 URL';
COMMENT ON COLUMN hr_core.announcement_attachment.file_size IS '파일 크기 (bytes)';
COMMENT ON COLUMN hr_core.announcement_attachment.content_type IS 'Content-Type';
