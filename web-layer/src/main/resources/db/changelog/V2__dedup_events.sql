-- Удалить дубликаты событий, оставить одно на каждую (вагон, операция, время)
-- Сохраняем строку с минимальным created_at (самую раннюю)
DELETE FROM dislocation_event
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY wagon_number, operation_code, operation_datetime
                   ORDER BY created_at ASC
               ) AS rn
        FROM dislocation_event
        WHERE operation_code IS NOT NULL
          AND operation_datetime IS NOT NULL
    ) ranked
    WHERE rn > 1
);

-- Уникальный частичный индекс: не даст сохранить дубль в будущем
CREATE UNIQUE INDEX IF NOT EXISTS ux_event_wagon_op_time
    ON dislocation_event (wagon_number, operation_code, operation_datetime)
    WHERE operation_code IS NOT NULL AND operation_datetime IS NOT NULL;
