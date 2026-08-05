-- «Остаток пробега» (до планового ремонта) — отдельная метрика от остатка расстояния
ALTER TABLE wagon
    ADD COLUMN IF NOT EXISTS remaining_mileage INTEGER;
