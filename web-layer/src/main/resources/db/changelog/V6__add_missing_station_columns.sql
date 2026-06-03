-- Add missing lat and lng columns to railway_station table
ALTER TABLE railway_station
    ADD COLUMN IF NOT EXISTS lat DECIMAL(9,6),
    ADD COLUMN IF NOT EXISTS lng DECIMAL(9,6);
