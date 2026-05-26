package ru.alabuga.analytics.dto.datareon;

import java.time.LocalDateTime;

public record EventDto(
    String id,
    LocalDateTime time,
    String direction,   // "INBOUND" | "OUTBOUND"
    String system,      // "WMS" | "TOS" | "1C" | "DATAREON"
    String eventType,
    String status,      // "Успешно" | "Ошибка" | "В обработке" | "Завис"
    String error
) {}
