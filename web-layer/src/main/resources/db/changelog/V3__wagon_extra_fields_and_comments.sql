-- Дополнительные поля вагона из последнего события дислокации
ALTER TABLE wagon
    ADD COLUMN IF NOT EXISTS wagon_type                VARCHAR(100),
    ADD COLUMN IF NOT EXISTS waybill_number            VARCHAR(50),
    ADD COLUMN IF NOT EXISTS sending_number            VARCHAR(50),
    ADD COLUMN IF NOT EXISTS wagon_position            INTEGER,
    ADD COLUMN IF NOT EXISTS distance_traveled         INTEGER,
    ADD COLUMN IF NOT EXISTS total_distance            INTEGER,
    ADD COLUMN IF NOT EXISTS gng_code                  VARCHAR(20),
    ADD COLUMN IF NOT EXISTS number_loaded_containers  INTEGER,
    ADD COLUMN IF NOT EXISTS number_empty_containers   INTEGER,
    ADD COLUMN IF NOT EXISTS flight_start_date         TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS flight_start_station_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS flight_start_station_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS destination_station_name  VARCHAR(255);

-- Комментарии к рейсам
CREATE TABLE IF NOT EXISTS trip_comment (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id    UUID        NOT NULL REFERENCES wagon_trip(id) ON DELETE CASCADE,
    author     VARCHAR(100) NOT NULL,
    body       TEXT         NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_comment_trip ON trip_comment(trip_id, created_at);
