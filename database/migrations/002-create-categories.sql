CREATE TABLE IF NOT EXISTS categories (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    is_default  BOOLEAN         NOT NULL DEFAULT FALSE,
    user_id     INTEGER         REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_name_user
    ON categories (name, COALESCE(user_id, -1));
