-- ============================================================
-- TodoListApp Database Schema
-- 관련 문서: docs/6-erd.md, docs/2-prd.md
-- ============================================================

-- ============================================================
-- 1. users 테이블
--    애플리케이션에 가입한 사용자 정보를 관리하는 기본 엔티티
-- ============================================================
CREATE TABLE users (
    id          SERIAL          PRIMARY KEY,
    email       VARCHAR(255)    NOT NULL UNIQUE,
    password    VARCHAR(255)    NOT NULL,              -- bcrypt 해시 저장 (평문 금지)
    name        VARCHAR(100)    NOT NULL,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
    -- 2차 OAuth 확장 시 추가 예정:
    -- oauth_provider VARCHAR(50),
    -- oauth_id       VARCHAR(255)
);

-- ============================================================
-- 2. categories 테이블
--    기본 카테고리(is_default=TRUE) 및 사용자 정의 카테고리를 관리
--    user_id = NULL  → 모든 사용자가 사용하는 시스템 기본 카테고리
--    user_id = 특정값 → 해당 사용자만 사용하는 사용자 정의 카테고리
-- ============================================================
CREATE TABLE categories (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    is_default  BOOLEAN         NOT NULL DEFAULT FALSE,
    user_id     INTEGER         REFERENCES users(id) ON DELETE CASCADE
    -- user_id = NULL 허용: 기본 카테고리는 소유자 없음
);

-- 동일 user_id 범위 내 name 중복 방지
-- user_id가 NULL인 기본 카테고리끼리도 name 중복 불가
CREATE UNIQUE INDEX uq_categories_name_user
    ON categories (name, COALESCE(user_id, -1));

-- ============================================================
-- 3. todos 테이블
--    사용자가 등록한 할일 정보를 관리하는 핵심 엔티티
--    기간 초과(Overdue): due_date < CURRENT_DATE AND is_completed = FALSE
-- ============================================================
CREATE TABLE todos (
    id            SERIAL          PRIMARY KEY,
    user_id       INTEGER         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id   INTEGER         NOT NULL REFERENCES categories(id),
    title         VARCHAR(255)    NOT NULL,
    description   TEXT,                                -- NULL 허용 (선택 입력)
    due_date      DATE,                                -- NULL 허용 (선택 입력)
    is_completed  BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. 인덱스
--    할일 목록 조회 필터링(user_id, category_id, is_completed) 성능 최적화
-- ============================================================
CREATE INDEX idx_todos_user_id        ON todos (user_id);
CREATE INDEX idx_todos_category_id    ON todos (category_id);
CREATE INDEX idx_todos_is_completed   ON todos (user_id, is_completed);
CREATE INDEX idx_todos_due_date       ON todos (user_id, due_date) WHERE due_date IS NOT NULL;

-- ============================================================
-- 5. 기본 카테고리 시드 데이터
--    user_id = NULL, is_default = TRUE
--    모든 사용자가 즉시 사용 가능 (PRD §9 기본 카테고리 초기 데이터)
-- ============================================================
INSERT INTO categories (name, is_default, user_id) VALUES
    ('업무',   TRUE, NULL),
    ('개인',   TRUE, NULL),
    ('쇼핑',   TRUE, NULL),
    ('기타',   TRUE, NULL);
