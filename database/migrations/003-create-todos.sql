CREATE TABLE IF NOT EXISTS todos (
    id            SERIAL          PRIMARY KEY,
    user_id       INTEGER         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id   INTEGER         NOT NULL REFERENCES categories(id),
    title         VARCHAR(255)    NOT NULL,
    description   TEXT,
    due_date      DATE,
    is_completed  BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_todos_user_id        ON todos (user_id);
CREATE INDEX IF NOT EXISTS idx_todos_category_id    ON todos (category_id);
CREATE INDEX IF NOT EXISTS idx_todos_is_completed   ON todos (user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_todos_due_date       ON todos (user_id, due_date) WHERE due_date IS NOT NULL;
