CREATE TABLE IF NOT EXISTS sync_cursor (
    id              BIGINT       PRIMARY KEY,
    last_processed_at TIMESTAMPTZ NOT NULL DEFAULT '1970-01-01 00:00:00+00'
);

INSERT INTO sync_cursor (id, last_processed_at)
VALUES (1, '1970-01-01 00:00:00+00')
ON CONFLICT (id) DO NOTHING;
