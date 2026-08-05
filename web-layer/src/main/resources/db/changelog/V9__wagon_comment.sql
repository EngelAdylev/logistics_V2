-- Комментарии к вагону (чат-история): кто, что, когда
CREATE TABLE IF NOT EXISTS wagon_comment (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    wagon_id   UUID        NOT NULL,
    author     VARCHAR(100) NOT NULL,
    body       TEXT        NOT NULL,
    created_at TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wagon_comment_wagon_id ON wagon_comment(wagon_id, created_at);
