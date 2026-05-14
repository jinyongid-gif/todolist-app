INSERT INTO categories (name, is_default, user_id) VALUES
    ('업무',   TRUE, NULL),
    ('개인',   TRUE, NULL),
    ('쇼핑',   TRUE, NULL),
    ('기타',   TRUE, NULL)
ON CONFLICT DO NOTHING;
